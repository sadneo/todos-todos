#![allow(dead_code)]

use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::SystemTime;

use axum::extract::{Extension, Json, Path, Request, State};
use axum::http::{header, StatusCode};
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use axum::{routing, Router};
use serde::{Deserialize, Serialize};
use serde_json::{de, ser};
use tokio::{fs, io};

const DEFAULT_PRIORITY: u8 = 127;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Tag {
    name: String,
    color: String, // placeholder
}

#[derive(Debug, Deserialize)]
struct AddTodo {
    short: String,
    description: String,
    priority: u8,
    tags: Vec<Tag>,
}

#[derive(Debug, Deserialize)]
struct EditTodo {
    index: usize,
    short: String,
    description: String,
    priority: u8,
    tags: Vec<Tag>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Todo {
    short: String,
    description: String,
    priority: u8,
    tags: Vec<Tag>,
    time: SystemTime,
}

const SHARE_PATH: &str = "/Projects/todos-todos"; // contains data.json and static/
const DIR_NAME: &str = "/todo";
const FILE_NAME: &str = "/data.json";

#[tokio::main]
async fn main() -> io::Result<()> {
    let path = std::env::var("HOME").unwrap() + SHARE_PATH;
    // let path = match std::env::var("XDG_DATA_HOME") {
    //     Ok(state_home) => state_home + DIR_NAME,
    //     Err(_) => std::env::var("HOME").unwrap() + SHARE_PATH + DIR_NAME,
    // };
    let file_path = path.clone() + FILE_NAME;

    let todos: Vec<Todo> = match std::fs::read(&file_path) {
        Ok(file) => de::from_slice(&file).unwrap(),
        Err(e) => match e.kind() {
            io::ErrorKind::NotFound => {
                let todos: Vec<Todo> = vec![];
                let contents = ser::to_vec(&todos).unwrap();
                std::fs::create_dir_all(&path)?;
                std::fs::write(&file_path, contents.as_slice())?;
                todos
            }
            _ => panic!("{}", e),
        },
    };

    let state = Arc::new(Mutex::new(todos));

    let router = Router::new()
        .route("/", routing::get(homepage))
        .route("/static/*path", routing::get(handle_static))
        .route("/get/*filter_type", routing::get(get_todos))
        .route("/add", routing::post(add_todo))
        .route("/edit", routing::patch(edit_todo))
        .route("/delete", routing::delete(delete_todo))
        .route_layer(middleware::from_fn_with_state(state.clone(), save_state))
        .layer(Extension((path, file_path)))
        .with_state(state.clone());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    axum::serve(listener, router).await?;
    Ok(())
}

async fn save_state(
    State(todos): State<Arc<Mutex<Vec<Todo>>>>,
    Extension((_, file_path)): Extension<(String, String)>,
    request: Request,
    next: Next,
) -> Response {
    let response = next.run(request).await;
    let bytes = ser::to_vec(&*todos.lock().unwrap()).unwrap();
    fs::write(file_path, bytes).await.unwrap();

    response
}

async fn homepage(
    Extension((path, _)): Extension<(String, String)>,
) -> Result<impl IntoResponse, StatusCode> {
    get_static(path, "homepage.html".to_owned()).await
}

async fn handle_static(
    Extension((path, _)): Extension<(String, String)>,
    Path(file): Path<String>,
) -> Result<impl IntoResponse, StatusCode> {
    get_static(path, file).await
}

async fn get_static(path: String, file: String) -> Result<impl IntoResponse, StatusCode> {
    let mut path = PathBuf::from(path);
    path.push("static");
    path.push(file);

    let content_type = match path.extension().map_or("", |os_str| {
        os_str.to_str().expect("extension should be valid str")
    }) {
        "html" => "text/html",
        "css" => "text/css",
        "js" => "text/javascript",
        _ => "application/octet-stream",
    };

    fs::read(path)
        .await
        .map_or(Err(StatusCode::NOT_FOUND), |bytes| {
            Ok(([(header::CONTENT_TYPE, content_type)], bytes))
        })
}

async fn get_todos(
    State(todos): State<Arc<Mutex<Vec<Todo>>>>,
    Path(filter_type): Path<u32>,
) -> Result<String, StatusCode> {
    let todo = todos.lock().unwrap();

    if filter_type == 0 {
        Ok(ser::to_string(&*todo).unwrap())
    } else if filter_type == 1 {
        let mut sorted = todo.clone();
        sorted.sort_unstable_by_key(|todo| todo.priority);
        Ok(ser::to_string(&*sorted).unwrap())
    } else {
        return Err(StatusCode::BAD_REQUEST);
    }
}

async fn add_todo(
    State(todos): State<Arc<Mutex<Vec<Todo>>>>,
    Json(todo_data): Json<AddTodo>,
) -> StatusCode {
    let time = SystemTime::now();
    let todo = Todo {
        time,
        short: todo_data.short,
        description: todo_data.description,
        priority: todo_data.priority,
        tags: todo_data.tags,
    };
    todos.lock().unwrap().push(todo);
    StatusCode::CREATED
}

async fn edit_todo(
    State(state): State<Arc<Mutex<Vec<Todo>>>>,
    Json(todo_data): Json<EditTodo>,
) -> StatusCode {
    let mut todos = state.lock().unwrap();
    let Some(todo) = todos.get_mut(todo_data.index) else {
        return StatusCode::NOT_FOUND;
    };

    todo.short = todo_data.short;
    todo.description = todo_data.description;
    todo.priority = todo_data.priority;
    todo.tags = todo_data.tags;
    StatusCode::OK
}

async fn delete_todo(
    State(state): State<Arc<Mutex<Vec<Todo>>>>,
    Json(index): Json<usize>,
) -> StatusCode {
    let mut todos = state.lock().unwrap();
    if index >= todos.len() {
        return StatusCode::NOT_FOUND;
    } // so swap_remove doesn't panic

    todos.swap_remove(index);
    StatusCode::OK
}

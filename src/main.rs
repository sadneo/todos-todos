#![allow(dead_code)]

use std::time::SystemTime;
use std::sync::{Arc, Mutex};

use axum::{routing, Router};
use axum::middleware::{self, Next};
use axum::response::Response;
use axum::extract::{Path, State, Request, Extension};
use axum::http::StatusCode;
use tokio::{io, fs};
use serde_json::{ser, de};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Todo {
    time: SystemTime,
    content: String,
}

const SHARE_PATH: &str = "/.local/share";
const DIR_NAME: &str = "/todo";
const FILE_NAME: &str = "/data.json";

#[tokio::main]
async fn main() -> io::Result<()> {
    let path = match std::env::var("XDG_DATA_HOME") {
        Ok(state_home) => state_home + DIR_NAME,
        Err(_) => std::env::var("HOME").unwrap() + SHARE_PATH + DIR_NAME,
    };
    let file_path = path.clone() + FILE_NAME;

    let todos: Vec<Todo> = match std::fs::read(&file_path) {
        Ok(file) => de::from_slice(&file).unwrap(),
        Err(e) => match e.kind() {
            io::ErrorKind::NotFound => {
                let todos: Vec<Todo> = vec![];
                let contents = ser::to_vec(&todos).unwrap();
                std::fs::create_dir_all(path)?;
                std::fs::write(&file_path, contents.as_slice())?;
                todos
            }
            _ => panic!("{}", e),
        }
    };

    let state = Arc::new(Mutex::new(todos));

    let router = Router::new()
        .route("/", routing::get(homepage))
        .route("/get", routing::get(get_todos))
        .route("/add/*content", routing::post(add_todo))
        .route("/edit/:id/*content", routing::patch(edit_todo))
        .route("/delete/:id", routing::delete(delete_todo))
        .route_layer(middleware::from_fn_with_state(state.clone(), save_state))
        .layer(Extension(file_path))
        .with_state(state.clone());

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    axum::serve(listener, router).await?;
    Ok(())
}

async fn homepage() -> &'static str {
    "Hello world!"
}

async fn save_state (State(todos): State<Arc<Mutex<Vec<Todo>>>>, Extension(file_path): Extension<String>, request: Request, next: Next) -> Response {
    let bytes = ser::to_vec(&*todos.lock().unwrap()).unwrap();
    fs::write(file_path, bytes).await.unwrap();
    next.run(request).await
}

async fn get_todos(State(todos): State<Arc<Mutex<Vec<Todo>>>>) -> String {
    let todo = todos.lock().unwrap();
    ser::to_string(&*todo).unwrap()
}

async fn add_todo(State(todos): State<Arc<Mutex<Vec<Todo>>>>, Path(content): Path<String>) -> StatusCode {
    let time = SystemTime::now();
    let todo = Todo{time, content};
    todos.lock().unwrap().push(todo);
    StatusCode::CREATED
}

async fn edit_todo(State(state): State<Arc<Mutex<Vec<Todo>>>>, Path((id, content)): Path<(usize, String)>) -> StatusCode {
    let mut todos = state.lock().unwrap();
    let Some(todo) = todos.get_mut(id) else {return StatusCode::NOT_FOUND};
    todo.content = content;
    StatusCode::OK
}

async fn delete_todo(State(state): State<Arc<Mutex<Vec<Todo>>>>, Path(index): Path<usize>) -> StatusCode {
    let mut todos = state.lock().unwrap();
    if index >= todos.len() {return StatusCode::NOT_FOUND} // so swap_remove doesn't panic
    todos.swap_remove(index);
    StatusCode::OK
}

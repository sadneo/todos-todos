#![allow(dead_code)]

use axum::Router;
use axum::routing;
use axum::extract::State;
use tokio::io;
use serde_json::{ser, de};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Todo {
    time: u64,
    content: String,
}

const SHARE_PATH: &str = "/.local/share";
const DIR_NAME: &str = "/todo";
const FILE_NAME: &str = "/data.json";

#[tokio::main]
async fn main() -> std::io::Result<()> {
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

    // get todos uses state, middleware writes state to file

    let router = Router::new()
        .route("/", routing::get(homepage))
        .route("/todos", routing::get(get_todos))
        .with_state(todos);
        // .route("/todo/:id", routing::post(get_todos));
        // .route("/todo/:id", routing::patch(get_todos));
        // .route("/todo/:id", routing::delete(get_todos));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    axum::serve(listener, router).await?;
    Ok(())
}

async fn homepage() -> &'static str {
    "Hello world!"
}

async fn get_todos(State(todos): State<Vec<Todo>>) -> String {
    serde_json::to_string(&todos).unwrap()
}

async fn add_todo(todo: Todo) -> io::Result<()> {
    todo!("{:?}", todo);
}

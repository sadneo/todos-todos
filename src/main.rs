#![allow(dead_code)]

use axum::Router;
use axum::routing;
use tokio::io;

#[derive(Debug)]
struct Todo {
    time: u64,
    content: String,
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let router = Router::new()
        .route("/", routing::get(homepage));
        // .route("/api/get-todos", routing::get(shit))
        // .route("/api/add_todo", routing::post(shit))
        // .route("/api/edit_todo", routing::patch(shit))
        // .route("/api/delete_todo", routing::post(shit));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    axum::serve(listener, router).await?;
    Ok(())
}

async fn homepage() -> &'static str {
    "Hello world!"
}

async fn get_todos() -> Vec<Todo> {
    todo!();
}

async fn add_todo(todo: Todo) -> io::Result<()> {
    todo!("{:?}", todo);
}

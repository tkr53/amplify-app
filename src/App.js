import React, {useEffect, useReducer} from "react";

import {API, graphqlOperation} from "@aws-amplify/api"
import {PubSub} from "@aws-amplify/pubsub";

import {createTodo} from "./graphql/mutations";
import {listTodos} from "./graphql/queries"
import {onCreateTodo} from "./graphql/subscriptions"

import awsconfig from "./aws-exports"
import "./App.css"

API.configure(awsconfig)
PubSub.configure(awsconfig)

const QUERY = "QUERY"
const SUBSCRITION = "SUBSCRIPTION"

const initialState = {
  todos: []
}

const reducer = (state, action) => {
  switch (action.type) {
    case QUERY:
      return {...state, todos: action.todos}
    case SUBSCRITION:
      return {...state, todos: [...state.todos, action.todo]}
    default:
      return state
  }
}

async function createNewTodo() {
  const todo = { name: "Use AWS AppSync", description: "RealTime and Offline"};
  await API.graphqlOperation(graphqlOperation(createTodo, {input: todo}))
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    async function getData() {
      const todoData = await API.graphqlOperation(graphqlOperation(listTodos))
      dispatch({type: QUERY, todos: todoData.data.listTodos.items})
    }
    getData();

    const subscription = API.graphqlOperation(graphqlOperation(onCreateTodo)).subscribe({
      next: (eventData) => {
        const todo = eventData.value.data.onCreateTodo
        dispatch({type: SUBSCRITION, todo})
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="App">
      <button onClick={createNewTodo}>Add Todo</button>
      <div>
        {state.todos.length > 0 ?
          state.todos.map((todo) => <p key={todo.id}>{todo.name} : {todo.description}</p>) :
          <p>Add some todos!</p>
        }
      </div>
    </div>
  )
}

export default App;
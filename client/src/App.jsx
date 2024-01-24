import './App.css'
import "./index.css";
import Login from './assets/components/Login'
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
  redirect,
} from "react-router-dom";
import Register from './assets/components/Register';
import Chat from './assets/components/Chat';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Testing from './assets/components/Testing';

function App() {

  const {currentUser} = useContext(AuthContext)

  console.log(currentUser, `dari app.jsx`)


  const router = createBrowserRouter([
    {
      path: "/register",
      element: <Register />,
      loader: () => {
        if(localStorage.getItem("email")) {
          return redirect('/')
        }
        return null;
      }
    },
    {
      path: "/login",
      element: <Login />,
      loader: () => {
        if (localStorage.getItem("email")) {
          return redirect("/");
        }
        return null;
      }
    },
    {
      path: "/",
      element: <Chat />,
      loader: () => {
        if (!localStorage.getItem("email")) {
          return redirect("/login");
        }
        return null;
      }
    },
    {
      path: "/testing",
      element: <Testing />
    }
  ])

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App

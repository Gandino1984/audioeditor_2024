import { createBrowserRouter } from "react-router-dom";
import Layout from '../components/layout/Layout';
import HomePage from '../components/HomePage/HomePage';
import EditPage from '../components/EditPage/EditPage';


export const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <HomePage />,
        },
        {
          path: "/edit",
          element: <EditPage />,
        },   
      ]
    }
  ]);
  
  export default router;
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import EquipiersRestaurant from "./pages/EquipiersRestaurant";
import BriefDebrief from "./pages/BriefDebrief";
import PrivateRoute from "./components/PrivateRoute";
import StatsDashboard from "./pages/StatsDashboard";
import FormationsEquipiers from "./pages/FormationsEquipiers";
import EquipierFormations from "./pages/EquipierFormations";
import FormationValidation from "./pages/FormationValidation";
import DashboardFormation from "./pages/DashboardFormation";
import PlacementEquipe from "./pages/PlacementEquipe";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/users"
          element={
            <PrivateRoute roles={["ADMIN", "DIRECTEUR", "MANAGER"]}>
              <Users />
            </PrivateRoute>
          }
        />

        <Route
          path="/equipiers-restaurent"
          element={
            <PrivateRoute roles={["ADMIN", "DIRECTEUR", "MANAGER"]}>
              <EquipiersRestaurant />
            </PrivateRoute>
          }
        />

        <Route
          path="/brief-debrief"
          element={
            <PrivateRoute roles={["ADMIN", "DIRECTEUR", "MANAGER"]}>
              <BriefDebrief />
            </PrivateRoute>
          }
        />

        <Route
          path="/stats"
          element={
            <PrivateRoute roles={["ADMIN", "DIRECTEUR", "MANAGER"]}>
              <StatsDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/formations"
          element={
            <PrivateRoute roles={["ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"]}>
              <FormationsEquipiers />
            </PrivateRoute>
          }
        />

        <Route
          path="/formations/equipier/:equipierId"
          element={
            <PrivateRoute roles={["ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"]}>
              <EquipierFormations />
            </PrivateRoute>
          }
        />

        <Route
          path="/formations/equipier/:equipierId/formation/:formationCode"
          element={
            <PrivateRoute roles={["ADMIN", "DIRECTEUR", "MANAGER", "FORMATEUR"]}>
              <FormationValidation />
            </PrivateRoute>
          }
        />

        <Route
          path="/formations-dashboard"
          element={
            <PrivateRoute roles={["ADMIN", "DIRECTEUR", "MANAGER"]}>
              <DashboardFormation />
            </PrivateRoute>
          }
        />

        <Route
          path="/placement-equipe"
          element={
            <PrivateRoute roles={["ADMIN", "DIRECTEUR", "MANAGER"]}>
              <PlacementEquipe />
            </PrivateRoute>
          }
        />
      </Routes>
      

    </BrowserRouter>
  );
}

export default App;
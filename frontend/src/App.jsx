import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

import CreateExerciseSet          from './components/CreateExerciseSet'
import EditBundle                 from './components/EditBundle'
import BundleDetail               from './components/BundleDetail'
import CompletionPage             from './components/CompletionPage'
import Register                   from './pages/Register'
import HomePage                   from './pages/HomePage'
import HomeClinician              from './pages/Clinician/HomeClinician'
import HomePatient                from './pages/Patient/HomePatient'
import { AuthProvider }           from  "./AuthContext";
import ProtectedRoute             from  "./ProtectedRoute";
import Login                      from  "./pages/Login";
import MyProfile                  from  './pages/myProfile'
import MyExercises                from  './pages/Clinician/MyExercises'
import MyPatients                 from  './pages/Clinician/MyPatients'
import AddPatient                 from  './pages/Clinician/AddPatient'
import PatientDetail              from  './pages/Clinician/PatientDetail'
import EditBundleClinician        from  './pages/Clinician/EditBundleClinician'
import CreateClinicianExerciseSet from  './pages/Clinician/CreateClinicianExerciseSet'
import MyPatientExercises from './pages/Patient/MyPatientExercises.jsx'
import MyPatientProfile from './pages/Patient/myPatientProfile.jsx'

import HomeAdmin from './pages/Admin/HomeAdmin.jsx'

import ManageUsers from './pages/Admin/ManageUsers.jsx'
import ManageBundles from './pages/Admin/ManageBundles.jsx'
import CreateGlobalBundle from './pages/Admin/CreateGlobalBundle.jsx'
import EditGlobalBundle from './pages/Admin/EditGlobalBundle.jsx'

import HomeAdminDashboard from "./pages/Admin/HomeAdminDashboard.jsx";
import MyAdminProfile from "./pages/Admin/MyAdminProfile.jsx";





export default function App() {
  return (
    <AuthProvider>

      <BrowserRouter>
        <nav className="p-4 bg-gray-100 space-x-4">
          {/* <Link to="/create" className="text-blue-600 hover:underline">
            New Exercise Set
          </Link> */}
        </nav>

        <main className="p-6">
          <Routes>
            <Route path="/login"                 element={<Login />}/>

            <Route path="/"                 element={<HomePage />}/>
            <Route path="/create" element={<CreateExerciseSet />} />
            <Route path="/bundles/:id" element={<BundleDetail />} />
            <Route path="/bundles/:id/edit" element={<EditBundle />} />
            <Route path="/complete" element={<CompletionPage />} />
            <Route path="/register"             element={<Register/>}/> 
            <Route path="/unauthorized" element={<h1>Access Denied</h1>} />
            <Route path="/home-patient"          element={<ProtectedRoute allowedRoles={["patient"]}>            <HomePatient />              </ProtectedRoute>}/>
            <Route path="/mypatientexercises"    element={<MyPatientExercises />} />
            <Route path="/home-clinician"        element={<ProtectedRoute allowedRoles={["admin", "clinician"]}> <HomeClinician />            </ProtectedRoute>}/>
            <Route path="/myprofile"             element={<MyProfile />}/>
            <Route path="/mypatientprofile"             element={<MyPatientProfile />}/>
            <Route path="/myexercises"           element={<ProtectedRoute allowedRoles={["clinician"]}><MyExercises /></ProtectedRoute>} />
            <Route path="/create-clinician"      element={<ProtectedRoute allowedRoles={["clinician"]}>          <CreateClinicianExerciseSet /></ProtectedRoute>}/>
            <Route path="/edit-by-clinician/:id" element={<ProtectedRoute allowedRoles={["clinician"]}>          <EditBundleClinician />       </ProtectedRoute>}/>
            <Route path="/mypatients"            element={<ProtectedRoute allowedRoles={['clinician']}>          <MyPatients />                </ProtectedRoute>}/>
            <Route path="/add-patient"           element={<ProtectedRoute allowedRoles={['clinician']}>          <AddPatient />                </ProtectedRoute>}/>
            <Route path="/patients/:id"          element={<ProtectedRoute allowedRoles={['admin','clinician']}>  <PatientDetail />             </ProtectedRoute>}/>

         <Route
  path="/home-admin"
  element={
        <ProtectedRoute allowedRoles={["admin"]}>
      <HomeAdmin />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/users"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <ManageUsers />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/bundles"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <ManageBundles />
    </ProtectedRoute>
  }
/>

<Route
  path="/myAdminprofile"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <MyAdminProfile />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/bundles/create"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <CreateGlobalBundle />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/bundles/:id/edit"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <EditGlobalBundle />
    </ProtectedRoute>
  }
/>

<Route
  path="/home-admin-dashboard"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <HomeAdminDashboard />
    </ProtectedRoute>
  }
/>



          </Routes>


 
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}

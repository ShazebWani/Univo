import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/AuthContext"
import { SchoolThemeProvider } from "@/contexts/SchoolThemeContext"
import OfflineStatus from "@/components/OfflineStatus"

function App() {
  return (
    <AuthProvider>
      <SchoolThemeProvider>
        <OfflineStatus />
        <Pages />
        <Toaster />
      </SchoolThemeProvider>
    </AuthProvider>
  )
}

export default App 
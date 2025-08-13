import './App.css'
import Footer from './Footer/Footer'
import SwapForm from './SwapForm/SwapForm'
import TopBar from './TopBar/TopBar'

function App() {
  return <>
    <TopBar />
    <div className='app-body-wrapper'>
      <SwapForm />
    </div>
    <Footer />
  </>
}

export default App

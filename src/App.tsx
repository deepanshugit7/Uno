import { useState } from 'react'
import StartScreen from './components/StartScreen/StartScreen.tsx'
import GameBoard from './components/GameBoard/GameBoard.tsx'
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [botCount, setBotCount] = useState(2)
  const [humanCount, setHumanCount] = useState(1)

  const handleStart = (name: string, bots: number, humans: number) => {
    setPlayerName(name)
    setBotCount(bots)
    setHumanCount(humans)
    setGameStarted(true)
  }

  const handleBackToMenu = () => {
    setGameStarted(false)
    setPlayerName('')
    setBotCount(2)
    setHumanCount(1)
  }

  return (
    <div className="app">
      {!gameStarted ? (
        <StartScreen onStart={handleStart} />
      ) : (
        <GameBoard
          playerName={playerName}
          botCount={botCount}
          humanCount={humanCount}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  )
}

export default App

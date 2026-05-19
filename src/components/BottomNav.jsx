const TABS = [
  { label: 'Taverne',   emoji: '🍻' },
  { label: 'Aventure',  emoji: '🌲' },
  { label: 'Héros',     emoji: '🛡️' },
  { label: 'Économie',  emoji: '💰' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav" style={{ flexShrink: 0 }}>
      {TABS.map((t, i) => (
        <button
          key={i}
          className={`nav-item${activeTab === i ? ' active' : ''}`}
          onClick={() => onTabChange(i)}
        >
          <span className="nav-icon">{t.emoji}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

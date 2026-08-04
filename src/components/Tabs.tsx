export interface TabItem {
  id: string
  label: string
  icon?: string
}

interface TabsProps {
  tabs: TabItem[]
  activeId: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 md:mx-0 md:px-0 dark:border-slate-800">
      {tabs.map((tab) => {
        const activo = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activo
                ? 'border-union-red-600 text-union-red-700 dark:border-union-red-400 dark:text-union-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

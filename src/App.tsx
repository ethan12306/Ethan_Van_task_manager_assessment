import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useGuestSession } from './hooks/useGuestSession'
import { useTasks } from './hooks/useTasks'
import { useTeamMembers } from './hooks/useTeamMembers'
import { useLabels } from './hooks/useLabels'
import { COLUMNS } from './types/task'
import type { Task, TaskStatus, TaskPriority } from './types/task'
import { Column } from './components/Column'
import { TaskCardVisual } from './components/TaskCard'
import { CreateTaskModal } from './components/CreateTaskModal'
import { TaskDetailModal } from './components/TaskDetailModal'
import { BoardStats } from './components/BoardStats'
import { BoardToolbar } from './components/BoardToolbar'

function App() {
  const { user, loading: sessionLoading } = useGuestSession()
  const { tasks, loading: tasksLoading, error, addTask, updateStatus, reorder } = useTasks(user?.id)
  const { members, addMember } = useTeamMembers(user?.id)
  const { labels, taskLabels, createLabel, toggleLabel } = useLabels(user?.id)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [labelFilter, setLabelFilter] = useState('')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const visibleTasks = tasks.filter((t) => {
    if (labelFilter && !(taskLabels[t.id] ?? []).includes(labelFilter)) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    if (assigneeFilter && t.assignee_id !== assigneeFilter) return false
    if (search.trim() && !t.title.toLowerCase().includes(search.trim().toLowerCase())) return false
    return true
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const boardStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter(
      (t) => t.due_date && t.status !== 'done' && new Date(t.due_date + 'T00:00:00') < today
    ).length,
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    const overId = over.id as string
    const overTask = tasks.find((t) => t.id === overId)
    const newStatus: TaskStatus = overTask ? overTask.status : (overId as TaskStatus)
    const statusChanged = draggedTask.status !== newStatus

    if (overTask && !statusChanged) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id)
      const newIndex = tasks.findIndex((t) => t.id === overId)
      reorder(arrayMove(tasks, oldIndex, newIndex))
      return
    }

    if (statusChanged) {
      updateStatus(draggedTask.id, newStatus)
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--ink-muted)' }}>
        Setting up your session…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4" style={{ color: '#B3452F' }}>
        Couldn't start a guest session. Check your .env values and that
        anonymous sign-in is enabled in Supabase Auth settings.
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-8" style={{ background: 'var(--bg)' }}>
      <header className="mb-8 flex items-end justify-between max-w-6xl mx-auto">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
          >
            Task Board
          </h1>
          <p className="stat-digit mt-1">session {user.id.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="text-sm font-medium px-4 py-2 rounded-md text-white"
            style={{ background: 'var(--accent)', fontFamily: 'var(--font-body)' }}
          >
            + Task
          </button>
        </div>
      </header>

      <BoardStats total={boardStats.total} completed={boardStats.completed} overdue={boardStats.overdue} />

      <BoardToolbar
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        labelFilter={labelFilter}
        onLabelFilterChange={setLabelFilter}
        members={members}
        labels={labels}
      />

      {error && (
        <div className="max-w-6xl mx-auto mb-4 text-sm px-3 py-2 rounded-md" style={{ color: '#B3452F', background: '#FBEAE6' }}>
          {error}
        </div>
      )}

      {tasksLoading ? (
        <div className="max-w-6xl mx-auto text-sm" style={{ color: 'var(--ink-muted)' }}>
          Loading tasks…
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                id={col.id}
                label={col.label}
                tasks={visibleTasks.filter((t) => t.status === col.id)}
                members={members}
                labels={labels}
                taskLabels={taskLabels}
                onTaskClick={setDetailTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="w-56">
                <TaskCardVisual
                  task={activeTask}
                  displayNumber={
                    tasks.filter((t) => t.status === activeTask.status).findIndex((t) => t.id === activeTask.id) + 1
                  }
                  assignee={members.find((m) => m.id === activeTask.assignee_id)}
                  labels={labels.filter((l) => (taskLabels[activeTask.id] ?? []).includes(l.id))}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {modalOpen && (
        <CreateTaskModal
          onClose={() => setModalOpen(false)}
          onCreate={addTask}
          members={members}
          onAddMember={addMember}
        />
      )}

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          assignee={members.find((m) => m.id === detailTask.assignee_id)}
          userId={user.id}
          labels={labels}
          activeLabelIds={taskLabels[detailTask.id] ?? []}
          onToggleLabel={(labelId) => toggleLabel(detailTask.id, labelId)}
          onCreateLabel={createLabel}
          onClose={() => setDetailTask(null)}
        />
      )}
    </div>
  )
}

export default App

import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Calendar, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const TaskManager = ({ tasks, subjects, onAddTask, onToggleTask, onDeleteTask }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    subject: '',
    task: '',
    dueDate: '',
    priority: 'medium',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTask.subject && newTask.task) {
      onAddTask(newTask);
      setNewTask({ subject: '', task: '', dueDate: '', priority: 'medium' });
      setIsDialogOpen(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSubjectColor = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.color || '#6b7280';
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Desconhecido';
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.priority !== b.priority) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return (
    <div className="task-manager-container">
      <div className="task-manager-header">
        <h2 className="task-manager-title">Gerenciar Tarefas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="add-task-btn">
              <Plus size={18} />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="task-dialog">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-field">
                <Label htmlFor="subject">Matéria</Label>
                <Select value={newTask.subject} onValueChange={(value) => setNewTask({ ...newTask, subject: value })}>
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Selecione a matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.icon} {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="task">Descrição da Tarefa</Label>
                <Textarea
                  id="task"
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                  placeholder="Ex: Resolver lista de exercícios do capítulo 3"
                  rows={3}
                />
              </div>

              <div className="form-field">
                <Label htmlFor="dueDate">Data de Entrega</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>

              <div className="form-field">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 Alta</SelectItem>
                    <SelectItem value="medium">🟡 Média</SelectItem>
                    <SelectItem value="low">🟢 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-actions">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!newTask.subject || !newTask.task}>
                  Adicionar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="tasks-list">
        {sortedTasks.length === 0 ? (
          <div className="empty-tasks">
            <AlertCircle size={48} />
            <p>Nenhuma tarefa cadastrada</p>
            <span>Adicione tarefas para organizar seus estudos</span>
          </div>
        ) : (
          sortedTasks.map(task => (
            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <div className="task-checkbox" onClick={() => onToggleTask(task.id)}>
                {task.completed ? (
                  <CheckCircle2 size={24} style={{ color: getSubjectColor(task.subject) }} />
                ) : (
                  <Circle size={24} className="unchecked-circle" />
                )}
              </div>

              <div className="task-content">
                <div className="task-header">
                  <span 
                    className="task-subject-tag" 
                    style={{ backgroundColor: `${getSubjectColor(task.subject)}20`, color: getSubjectColor(task.subject) }}
                  >
                    {getSubjectName(task.subject)}
                  </span>
                  <span 
                    className="task-priority-tag" 
                    style={{ backgroundColor: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}
                  >
                    {task.priority === 'high' ? '🔴 Alta' : task.priority === 'medium' ? '🟡 Média' : '🟢 Baixa'}
                  </span>
                </div>
                <p className="task-description">{task.task}</p>
                {task.dueDate && (
                  <div className="task-due-date">
                    <Calendar size={14} />
                    {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>

              <button className="task-delete-btn" onClick={() => onDeleteTask(task.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManager;

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArrowDownToLine,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Factory,
  Menu,
  MessageCircle,
  Package,
  Plus,
  Scissors,
  Search,
  Settings2,
  Trash2,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { supabase } from './integrations/supabase/client'

type TableName = 'productions' | 'batches' | 'seamstresses' | 'payments' | 'quality_controls' | 'internal_employees' | 'internal_cost_items' | 'suppliers' | 'whatsapp_messages'
type RecordData = Record<string, unknown>

type ScreenConfig = {
  key: TableName
  label: string
  title: string
  description: string
  icon: typeof Factory
  columns: string[]
  fields: { name: string; label: string; type?: string; required?: boolean }[]
}

const screens: ScreenConfig[] = [
  { key: 'productions', label: 'Produções', title: 'Produções', description: 'Acompanhe pedidos e peças em produção.', icon: Factory, columns: ['production_code', 'supplier', 'product_name', 'quantity', 'delivery_date'], fields: [
    { name: 'production_code', label: 'Código da produção', required: true }, { name: 'supplier', label: 'Fornecedor', required: true }, { name: 'product_name', label: 'Produto' }, { name: 'quantity', label: 'Quantidade', type: 'number', required: true }, { name: 'delivery_date', label: 'Data de entrega', type: 'date', required: true }, { name: 'price_per_unit', label: 'Preço por unidade', type: 'number' }, { name: 'labels', label: 'Etiquetas' }, { name: 'trims', label: 'Aviamentos' }, { name: 'notes', label: 'Observações', type: 'textarea' },
  ] },
  { key: 'batches', label: 'Lotes', title: 'Lotes de produção', description: 'Controle dos lotes enviados para execução.', icon: Package, columns: ['batch_code', 'production_id', 'seamstress_id', 'quantity', 'expected_return_date'], fields: [
    { name: 'batch_code', label: 'Código do lote', required: true }, { name: 'production_id', label: 'ID da produção', required: true }, { name: 'seamstress_id', label: 'ID da costureira' }, { name: 'quantity', label: 'Quantidade', type: 'number', required: true }, { name: 'expected_return_date', label: 'Previsão de retorno', type: 'date', required: true }, { name: 'price_per_unit', label: 'Preço por unidade', type: 'number' }, { name: 'notes', label: 'Observações', type: 'textarea' },
  ] },
  { key: 'seamstresses', label: 'Costureiras', title: 'Costureiras', description: 'Cadastre e consulte sua rede de costureiras.', icon: Scissors, columns: ['name', 'phone', 'pix', 'number_of_workers', 'address'], fields: [
    { name: 'name', label: 'Nome', required: true }, { name: 'phone', label: 'Telefone', required: true }, { name: 'pix', label: 'PIX' }, { name: 'address', label: 'Endereço' }, { name: 'neighborhood', label: 'Bairro' }, { name: 'number_of_workers', label: 'Número de trabalhadores', type: 'number' }, { name: 'notes', label: 'Observações', type: 'textarea' },
  ] },
  { key: 'payments', label: 'Pagamentos', title: 'Pagamentos', description: 'Registre valores devidos e pagos por lote.', icon: CircleDollarSign, columns: ['batch_id', 'seamstress_id', 'amount', 'due_date', 'paid_date'], fields: [
    { name: 'batch_id', label: 'ID do lote', required: true }, { name: 'seamstress_id', label: 'ID da costureira', required: true }, { name: 'amount', label: 'Valor', type: 'number', required: true }, { name: 'due_date', label: 'Vencimento', type: 'date' }, { name: 'paid_date', label: 'Data do pagamento', type: 'date' }, { name: 'notes', label: 'Observações', type: 'textarea' },
  ] },
  { key: 'quality_controls', label: 'Qualidade', title: 'Controle de qualidade', description: 'Verifique os critérios de qualidade de cada lote.', icon: ClipboardCheck, columns: ['batch_id', 'seamstress', 'sewing_quality', 'measurements', 'cleaning', 'classification'], fields: [
    { name: 'batch_id', label: 'ID do lote', required: true }, { name: 'seamstress', label: 'Costureira', required: true }, { name: 'sewing_quality', label: 'Qualidade da costura', type: 'checkbox' }, { name: 'measurements', label: 'Medidas', type: 'checkbox' }, { name: 'cleaning', label: 'Limpeza', type: 'checkbox' }, { name: 'trims', label: 'Aviamentos', type: 'checkbox' }, { name: 'labels', label: 'Etiquetas', type: 'checkbox' }, { name: 'notes', label: 'Observações', type: 'textarea' },
  ] },
  { key: 'internal_employees', label: 'Funcionários', title: 'Funcionários internos', description: 'Organize a equipe e os custos de pessoal.', icon: Users, columns: ['name', 'role', 'salary', 'transport_daily', 'active'], fields: [
    { name: 'name', label: 'Nome', required: true }, { name: 'role', label: 'Função', required: true }, { name: 'salary', label: 'Salário', type: 'number' }, { name: 'transport_daily', label: 'Transporte diário', type: 'number' }, { name: 'benefits_monthly', label: 'Benefícios mensais', type: 'number' }, { name: 'employer_charges_monthly', label: 'Encargos mensais', type: 'number' }, { name: 'work_days_per_month', label: 'Dias de trabalho por mês', type: 'number' }, { name: 'notes', label: 'Observações', type: 'textarea' },
  ] },
  { key: 'internal_cost_items', label: 'Custos', title: 'Custos internos', description: 'Controle despesas fixas e variáveis da operação.', icon: BarChart3, columns: ['description', 'category', 'cost_type', 'amount', 'active'], fields: [
    { name: 'description', label: 'Descrição', required: true }, { name: 'category', label: 'Categoria', required: true }, { name: 'amount', label: 'Valor', type: 'number', required: true }, { name: 'work_days_per_month', label: 'Dias de trabalho por mês', type: 'number' }, { name: 'effective_date', label: 'Data de início', type: 'date' }, { name: 'notes', label: 'Observações', type: 'textarea' },
  ] },
  { key: 'suppliers', label: 'Fornecedores', title: 'Fornecedores', description: 'Mantenha os contatos de fornecedores organizados.', icon: Truck, columns: ['name', 'phone', 'email', 'address'], fields: [
    { name: 'name', label: 'Nome', required: true }, { name: 'phone', label: 'Telefone' }, { name: 'email', label: 'E-mail', type: 'email' }, { name: 'address', label: 'Endereço' }, { name: 'notes', label: 'Observações', type: 'textarea' },
  ] },
  { key: 'whatsapp_messages', label: 'WhatsApp', title: 'WhatsApp', description: 'Consulte as mensagens registradas pelo atendimento.', icon: MessageCircle, columns: ['sender_name', 'sender_phone', 'message', 'direction', 'is_read'], fields: [
    { name: 'remote_jid', label: 'Remote JID', required: true }, { name: 'sender_name', label: 'Nome do remetente' }, { name: 'sender_phone', label: 'Telefone do remetente' }, { name: 'message', label: 'Mensagem', type: 'textarea', required: true }, { name: 'is_read', label: 'Mensagem lida', type: 'checkbox' },
  ] },
]

const menuGroups = [
  { label: 'Operação', items: ['productions', 'batches', 'quality_controls'] },
  { label: 'Pessoas e finanças', items: ['seamstresses', 'payments', 'internal_employees', 'internal_cost_items'] },
  { label: 'Relacionamento', items: ['suppliers', 'whatsapp_messages'] },
]

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (typeof value === 'string' && value.includes('T')) return new Date(value).toLocaleDateString('pt-BR')
  return String(value)
}

function App() {
  const [activeKey, setActiveKey] = useState<TableName>('productions')
  const [rows, setRows] = useState<RecordData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const active = screens.find((screen) => screen.key === activeKey)!

  async function loadRows() {
    setLoading(true)
    setError('')
    const { data, error: queryError } = await supabase.from(activeKey).select('*').order('created_at', { ascending: false }).limit(100)
    if (queryError) setError(queryError.message)
    setRows((data as RecordData[]) || [])
    setLoading(false)
  }

  useEffect(() => { void loadRows() }, [activeKey])

  const filteredRows = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())), [rows, search])

  async function deleteRow(id: string) {
    if (!window.confirm('Excluir este registro?')) return
    const { error: deleteError } = await supabase.from(activeKey).delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else setRows((current) => current.filter((row) => row.id !== id))
  }

  function selectScreen(key: string) {
    setActiveKey(key as TableName)
    setSearch('')
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-border bg-card p-5 transition-transform lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground"><Scissors size={22} /></div>
            <div><p className="font-bold">Ateliê Gestão</p><p className="text-xs text-muted-foreground">Confecção inteligente</p></div>
          </div>
          <button className="text-muted-foreground lg:hidden" onClick={() => setIsMenuOpen(false)}><X size={20} /></button>
        </div>
        <nav className="space-y-6">
          {menuGroups.map((group) => <div key={group.label}><p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</p><div className="space-y-1">{group.items.map((key) => { const item = screens.find((screen) => screen.key === key)!; const Icon = item.icon; return <button key={key} onClick={() => selectScreen(key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeKey === key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon size={18} />{item.label}</button> })}</div></div>)}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-muted p-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Settings2 size={16} /> Operação conectada</div><p className="text-xs leading-5 text-muted-foreground">Os registros são sincronizados diretamente com o banco de dados.</p></div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur md:px-8">
          <button className="rounded-lg p-2 hover:bg-muted lg:hidden" onClick={() => setIsMenuOpen(true)}><Menu size={22} /></button>
          <div className="hidden lg:block"><p className="text-sm text-muted-foreground">Painel de gestão</p><h1 className="text-xl font-bold">Visão geral da operação</h1></div>
          <div className="flex items-center gap-3"><div className="hidden rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex sm:items-center sm:gap-2"><CheckCircle2 size={14} /> Banco conectado</div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">AG</div></div>
        </header>

        <div className="p-5 md:p-8">
          <section className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm md:col-span-2"><p className="mb-2 text-sm text-slate-300">Controle centralizado</p><h2 className="max-w-lg text-2xl font-bold leading-tight">Tudo para sua produção funcionar com mais clareza.</h2><p className="mt-3 max-w-lg text-sm text-slate-300">Acompanhe pedidos, pessoas, custos e qualidade em um só lugar.</p></div>
            <div className="rounded-2xl border border-border bg-card p-5"><div className="mb-4 flex items-center justify-between"><p className="text-sm font-medium text-muted-foreground">Registros nesta tela</p><Archive className="text-primary" size={20} /></div><p className="text-3xl font-bold">{rows.length}</p><p className="mt-1 text-xs text-muted-foreground">últimos 100 registros</p></div>
          </section>

          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><active.icon size={16} /> Gestão operacional</div><h2 className="text-2xl font-bold">{active.title}</h2><p className="mt-1 text-sm text-muted-foreground">{active.description}</p></div><button onClick={() => setIsFormOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"><Plus size={18} /> Novo registro</button></div>
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"><Search size={18} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar em ${active.label.toLowerCase()}...`} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></div>
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border bg-muted/50"><tr>{active.columns.map((column) => <th key={column} className="px-5 py-4 font-semibold capitalize">{column.replaceAll('_', ' ')}</th>)}<th className="px-5 py-4 text-right">Ações</th></tr></thead><tbody className="divide-y divide-border">{loading ? <tr><td colSpan={active.columns.length + 1} className="px-5 py-12 text-center text-muted-foreground">Carregando registros...</td></tr> : filteredRows.length === 0 ? <tr><td colSpan={active.columns.length + 1} className="px-5 py-12 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr> : filteredRows.map((row) => <tr key={String(row.id)} className="hover:bg-muted/30">{active.columns.map((column) => <td key={column} className="max-w-[220px] truncate px-5 py-4">{formatValue(row[column])}</td>)}<td className="px-5 py-4 text-right"><button onClick={() => deleteRow(String(row.id))} className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600" title="Excluir"><Trash2 size={17} /></button></td></tr>)}</tbody></table></div></div>
        </div>
      </main>
      {isFormOpen && <RecordForm screen={active} onClose={() => setIsFormOpen(false)} onSaved={() => { setIsFormOpen(false); void loadRows() }} />}
    </div>
  )
}

function RecordForm({ screen, onClose, onSaved }: { screen: ScreenConfig; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<RecordData>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setField(name: string, value: unknown) { setForm((current) => ({ ...current, [name]: value })) }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload: RecordData = {}
    screen.fields.forEach((field) => { const value = form[field.name]; if (value !== undefined && value !== '') payload[field.name] = field.type === 'number' ? Number(value) : value })
    const { error: insertError } = await supabase.from(screen.key).insert(payload)
    if (insertError) setError(insertError.message)
    else onSaved()
    setSaving(false)
  }

  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card shadow-xl"><div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-5"><div><h2 className="text-lg font-bold">Novo registro</h2><p className="text-sm text-muted-foreground">Preencha os dados de {screen.label.toLowerCase()}.</p></div><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={20} /></button></div><form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2">{screen.fields.map((field) => field.type === 'textarea' ? <label key={field.name} className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">{field.label}{field.required && ' *'}</span><textarea required={field.required} value={String(form[field.name] ?? '')} onChange={(event) => setField(field.name, event.target.value)} rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" /></label> : field.type === 'checkbox' ? <label key={field.name} className="flex items-center gap-3 rounded-xl border border-border p-3"><input type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => setField(field.name, event.target.checked)} className="h-4 w-4 accent-blue-600" /><span className="text-sm font-medium">{field.label}</span></label> : <label key={field.name}><span className="mb-1.5 block text-sm font-medium">{field.label}{field.required && ' *'}</span><input required={field.required} type={field.type || 'text'} value={String(form[field.name] ?? '')} onChange={(event) => setField(field.name, event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" /></label>)}{error && <div className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-3 border-t border-border pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted">Cancelar</button><button disabled={saving} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar registro'}</button></div></form></div></div>
}

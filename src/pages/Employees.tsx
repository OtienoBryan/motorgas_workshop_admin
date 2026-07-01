import React, { useState, useEffect } from 'react'
import { adminApiService, Station, Staff } from '../services/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  XCircle,
  Users,
  UserCheck,
  UserX,
  Power
} from 'lucide-react'

interface EmployeeData {
  name: string
  phone_number: string
  empl_no: string
  id_no: string
  role: 'attendant' | 'manager'
  stationId: number | undefined
  startDate: string
  is_active: number
}

interface EmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  employee?: Staff | null
  onSave: (employeeData: Partial<Staff>) => Promise<void>
  isEditing: boolean
  stations: Station[]
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ 
  isOpen, 
  onClose, 
  employee, 
  onSave, 
  isEditing, 
  stations 
}) => {
  const [formData, setFormData] = useState<EmployeeData>({
    name: '',
    phone_number: '',
    empl_no: '',
    id_no: '',
    role: 'attendant',
    stationId: undefined,
    startDate: new Date().toISOString().split('T')[0],
    is_active: 1
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (isEditing && employee) {
        // Parse station ID from designation
        let stationId: number | undefined = undefined
        if (employee.designation) {
          try {
            const parsed = JSON.parse(employee.designation)
            if (Array.isArray(parsed) && parsed.length > 0) {
              stationId = parsed[0] // Get first station ID
            } else if (typeof parsed === 'number') {
              stationId = parsed
            }
          } catch {
            // If not JSON, try to parse as comma-separated or single number
            const stationIds = employee.designation.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            stationId = stationIds.length > 0 ? stationIds[0] : undefined
          }
        }
        
        setFormData({
          name: employee.name || '',
          phone_number: employee.phone_number || '',
          empl_no: employee.empl_no || '',
          id_no: employee.id_no || '',
          role: (employee.role === 'attendant' || employee.role === 'manager') ? (employee.role as 'attendant' | 'manager') : 'attendant',
          stationId: stationId,
          startDate: employee.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          is_active: employee.is_active !== undefined ? employee.is_active : 1
        })
      } else {
        setFormData({
          name: '',
          phone_number: '',
          empl_no: '',
          id_no: '',
          role: 'attendant',
          stationId: undefined,
          startDate: new Date().toISOString().split('T')[0],
          is_active: 1
        })
      }
    }
  }, [isOpen, isEditing, employee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      // Prepare employee data
      const employeeData: Partial<Staff> = {
        name: formData.name,
        phone_number: formData.phone_number,
        empl_no: formData.empl_no,
        id_no: formData.id_no,
        role: formData.role || 'attendant',
        // Store station ID as JSON in designation field (temporary solution)
        designation: formData.stationId !== undefined 
          ? JSON.stringify([formData.stationId]) 
          : null,
        // Store start date in department field (temporary solution until backend supports start_date)
        // Format: "YYYY-MM-DD" as prefix, can add more info later if needed
        department: formData.startDate || null,
        // Required fields
        photo_url: employee?.photo_url || 'https://via.placeholder.com/150',
        avatar_url: employee?.avatar_url || 'https://via.placeholder.com/150',
        password: employee?.password || '$2a$10$me0dzhAfGglEGPhcK/34BuWmhYW3USYy3SeMbe46CQop102Yq./1S',
        employment_type: 'Contract',
        gender: 'Male',
        is_active: formData.is_active,
        status: formData.is_active
      }
      
      await onSave(employeeData)
      onClose()
    } catch (error) {
      console.error('Error saving employee:', error)
      alert(`Failed to save employee: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded p-2 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-1.5">
          <h2 className="text-sm font-semibold">
            {isEditing ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter employee name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Contact *
            </label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number || ''}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter contact number"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Employee Number *
            </label>
            <input
              type="text"
              name="empl_no"
              value={formData.empl_no || ''}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter employee number"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              ID Number *
            </label>
            <input
              type="text"
              name="id_no"
              value={formData.id_no || ''}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter ID number"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Role *
            </label>
            <select
              name="role"
              value={formData.role || 'attendant'}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="attendant">Attendant</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Station *
            </label>
            <select
              name="stationId"
              value={formData.stationId || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                stationId: e.target.value ? Number(e.target.value) : undefined 
              }))}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a station</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate || ''}
              onChange={handleChange}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5 text-[11px]">
              Status *
            </label>
            <select
              name="is_active"
              value={formData.is_active}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                is_active: Number(e.target.value) 
              }))}
              required
              className="w-full px-1.5 py-0.5 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-1 pt-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-1.5 py-0.5 text-[11px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.stationId}
              className="px-1.5 py-0.5 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Staff[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [stationFilter, setStationFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Staff | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<number | null>(null)
  const [togglingEmployee, setTogglingEmployee] = useState<number | null>(null)

  useEffect(() => {
    fetchEmployees()
    fetchStations()
  }, [])

  const fetchEmployees = async () => {
    try {
      console.log('👥 [Employees] Fetching employees...')
      setLoading(true)
      const data = await adminApiService.getStaff()
      console.log('✅ [Employees] Employees fetched:', data)
      // Filter employees that have role as 'attendant' or 'manager'
      const filteredData = data.filter(emp => 
        emp.role === 'attendant' || emp.role === 'manager'
      )
      setEmployees(Array.isArray(filteredData) ? filteredData : [])
    } catch (error) {
      console.error('❌ [Employees] Error fetching employees:', error)
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStations = async () => {
    try {
      console.log('🚉 [Employees] Fetching stations...')
      const data = await adminApiService.getStations()
      console.log('✅ [Employees] Stations fetched:', data)
      setStations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [Employees] Error fetching stations:', error)
      setStations([])
    }
  }

  const handleCreate = () => {
    setEditingEmployee(null)
    setIsModalOpen(true)
  }

  const handleEdit = (employee: Staff) => {
    setEditingEmployee(employee)
    setIsModalOpen(true)
  }

  const handleSave = async (employeeData: Partial<Staff>) => {
    try {
      if (editingEmployee) {
        await adminApiService.updateStaff(editingEmployee.id, employeeData)
      } else {
        await adminApiService.createStaff(employeeData as Omit<Staff, 'id' | 'created_at' | 'updated_at'>)
      }
      await fetchEmployees()
    } catch (error) {
      console.error('Error saving employee:', error)
      throw error
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingEmployee(id)
      await adminApiService.deleteStaff(id)
      await fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert(`Failed to delete employee: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setDeletingEmployee(null)
    }
  }

  const handleToggleStatus = async (employee: Staff) => {
    const newStatus = employee.is_active === 1 ? 0 : 1
    const action = newStatus === 1 ? 'activate' : 'deactivate'
    
    if (!confirm(`Are you sure you want to ${action} this employee?`)) {
      return
    }

    try {
      setTogglingEmployee(employee.id)
      await adminApiService.updateStaff(employee.id, {
        is_active: newStatus,
        status: newStatus
      })
      await fetchEmployees()
    } catch (error) {
      console.error('Error toggling employee status:', error)
      alert(`Failed to ${action} employee: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setTogglingEmployee(null)
    }
  }

  const getStatusBadge = (isActive: number) => {
    return isActive === 1 ? (
      <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[9px] font-medium bg-green-100 text-green-800">
        <UserCheck className="h-2.5 w-2.5 mr-0.5" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[9px] font-medium bg-red-100 text-red-800">
        <UserX className="h-2.5 w-2.5 mr-0.5" />
        Inactive
      </span>
    )
  }

  const getStationId = (employee: Staff): number | null => {
    if (!employee.designation) return null
    try {
      const stationIds = JSON.parse(employee.designation)
      // Handle both array (for backward compatibility) and single number
      const stationId = Array.isArray(stationIds) ? stationIds[0] : stationIds
      if (stationId && typeof stationId === 'number') {
        return stationId
      }
    } catch {
      // Try comma-separated or single number
      const stationIds = employee.designation.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      if (stationIds.length > 0) {
        return stationIds[0]
      }
    }
    return null
  }

  const getStationName = (employee: Staff): string => {
    const stationId = getStationId(employee)
    if (stationId) {
      const station = stations.find(s => s.id === stationId)
      return station?.name || '-'
    }
    return '-'
  }

  const getStartDate = (employee: Staff): string => {
    // Try to get from department field (where we store it temporarily)
    // Format: "YYYY-MM-DD" or might contain other text
    if (employee.department) {
      const dateMatch = employee.department.match(/^\d{4}-\d{2}-\d{2}/)
      if (dateMatch) {
        return dateMatch[0]
      }
    }
    // Fallback to created_at
    if (employee.created_at) {
      return employee.created_at.split('T')[0]
    }
    return '-'
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.empl_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStationName(employee).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && employee.is_active === 1) ||
      (statusFilter === 'inactive' && employee.is_active === 0)
    
    const matchesStation = 
      stationFilter === 'all' || 
      getStationId(employee) === Number(stationFilter)
    
    return matchesSearch && matchesStatus && matchesStation
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-2 flex justify-between items-center">
          <h1 className="text-xs font-bold text-gray-900">Employees</h1>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="h-2.5 w-2.5" />
            Add
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-2 space-y-1.5">
          <div className="relative">
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <div>
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Stations</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Employees Table */}
        {filteredEmployees.length === 0 ? (
          <div className="bg-white rounded border p-3 text-center text-[10px] text-gray-500">
            No employees found
          </div>
        ) : (
          <div className="bg-white rounded border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Name</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Contact</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Employee #</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">ID Number</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Role</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Station</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Start Date</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Status</th>
                  <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-[10px]">{employee.name}</td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">{employee.phone_number || '-'}</td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">{employee.empl_no}</td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">{employee.id_no}</td>
                    <td className="px-2 py-1 text-[10px]">
                      <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-[9px] font-medium ${
                        employee.role === 'manager' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {employee.role === 'manager' ? 'Manager' : 'Attendant'}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">{getStationName(employee)}</td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">{getStartDate(employee)}</td>
                    <td className="px-2 py-1 text-[10px]">
                      {getStatusBadge(employee.is_active)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(employee)}
                          disabled={togglingEmployee === employee.id}
                          className={`p-0.5 ${
                            employee.is_active === 1 
                              ? 'text-orange-600 hover:text-orange-800' 
                              : 'text-green-600 hover:text-green-800'
                          } disabled:opacity-50`}
                          title={employee.is_active === 1 ? 'Deactivate' : 'Activate'}
                        >
                          {togglingEmployee === employee.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                          ) : (
                            <Power className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(employee)}
                          className="p-0.5 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          disabled={deletingEmployee === employee.id}
                          className="p-0.5 text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingEmployee === employee.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Employee Modal */}
        <EmployeeModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingEmployee(null)
          }}
          employee={editingEmployee}
          onSave={handleSave}
          isEditing={!!editingEmployee}
          stations={stations}
        />
      </div>
    </div>
  )
}

export default Employees


import React, { useEffect, useMemo, useState } from 'react';
import DroneCard from '../components/DroneCard';
import { Layout, Shield, ShieldAlert, Globe, Activity, Layers, Brain } from 'lucide-react';
import {
  clearAdminToken,
  createCountry,
  createCounterSystem,
  createDrone,
  deleteCountry,
  deleteCounterSystem,
  deleteDrone,
  getAdminSession,
  getAdminToken,
  getCountries,
  getCounterSystems,
  getDrones,
  loginAdmin,
  setAdminToken,
  updateCountry,
  updateCounterSystem,
  updateDrone,
} from '../services/api';

const droneTypes = ['Nano', 'Tactical', 'MALE', 'HALE', 'UCAV', 'Loitering', 'Swarm', 'QUANTUM'];
const counterTypes = ['Laser', 'Jamming', 'Missile', 'Interceptor'];
const effectivenessLevels = ['High', 'Medium', 'Low'];

const emptyDrone = {
  name: '',
  country: '',
  type: 'Nano',
  description: '',
  specs: {
    price_usd: 0,
    range_km: 0,
    endurance_hr: 0,
    payload_kg: 0,
    speed_kmh: 0,
    maintenance_cost_per_hr: 0,
  },
  image: '',
  model_url: '',
};

const emptyCountry = {
  name: '',
  code: '',
  drone_count: 0,
  specialization: '',
  top_drones: '',
  lat: 0,
  lng: 0,
  growth_rate: 0,
};

const emptyCounter = {
  name: '',
  type: 'Laser',
  effective_against: '',
  range_km: 0,
  effectiveness: 'High',
  description: '',
};

const defaultTableControls = {
  search: '',
  sortBy: 'name',
  sortDirection: 'asc',
  page: 1,
  pageSize: 5,
};

function normalizeError(error, fallbackMessage) {
  return (
    error?.response?.data?.details ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

function validateDroneForm(form) {
  if (!form.name.trim()) return 'Drone name is required.';
  if (!form.country.trim()) return 'Country is required.';
  if (!form.type) return 'Drone type is required.';

  const numericFields = Object.entries(form.specs);
  const hasInvalidValue = numericFields.some(([, value]) => Number(value) < 0 || Number.isNaN(Number(value)));

  if (hasInvalidValue) {
    return 'Drone specifications must be valid non-negative numbers.';
  }

  return '';
}

function validateCountryForm(form) {
  if (!form.name.trim()) return 'Country name is required.';
  if (!/^[A-Z]{3}$/.test(form.code.trim())) return 'Country code must be exactly 3 uppercase letters.';
  if (Number(form.drone_count) < 0) return 'Drone count cannot be negative.';
  if (Number.isNaN(Number(form.lat)) || Number(form.lat) < -90 || Number(form.lat) > 90) {
    return 'Latitude must be between -90 and 90.';
  }
  if (Number.isNaN(Number(form.lng)) || Number(form.lng) < -180 || Number(form.lng) > 180) {
    return 'Longitude must be between -180 and 180.';
  }
  if (Number(form.growth_rate) < 0) return 'Growth rate cannot be negative.';

  return '';
}

function validateCounterForm(form) {
  if (!form.name.trim()) return 'Counter-system name is required.';
  if (!form.type) return 'Counter-system type is required.';
  if (!form.effectiveness) return 'Effectiveness level is required.';
  if (!parseList(form.effective_against).length) return 'Add at least one effective-against value.';
  if (Number(form.range_km) < 0 || Number.isNaN(Number(form.range_km))) {
    return 'Range must be a valid non-negative number.';
  }
  if (!form.description.trim()) return 'Description is required.';

  return '';
}

function AdminSection({ title, children }) {
  return (
    <section className="glass-card space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="font-heading text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function AdminInput({ label, ...props }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-textMuted font-heading text-[11px] uppercase tracking-widest">{label}</span>
      <input
        {...props}
        className="bg-black/40 border border-white/10 p-3 rounded font-data text-white focus:border-neon outline-none"
      />
    </label>
  );
}

function AdminSelect({ label, children, ...props }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-textMuted font-heading text-[11px] uppercase tracking-widest">{label}</span>
      <select
        {...props}
        className="bg-black/40 border border-white/10 p-3 rounded font-data text-white focus:border-neon outline-none"
      >
        {children}
      </select>
    </label>
  );
}

function AdminTextarea({ label, ...props }) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-textMuted font-heading text-[11px] uppercase tracking-widest">{label}</span>
      <textarea
        {...props}
        className="bg-black/40 border border-white/10 p-3 rounded font-data text-white focus:border-neon outline-none min-h-24"
      />
    </label>
  );
}

function ActionButton({ variant = 'primary', ...props }) {
  const variantClass =
    variant === 'danger'
      ? 'border-danger text-danger hover:bg-danger hover:text-white'
      : variant === 'ghost'
        ? 'border-white/10 text-textMuted hover:border-border hover:text-white'
        : 'border-neon text-neon hover:bg-neon hover:text-dark';

  return (
    <button
      {...props}
      className={`px-4 py-2 rounded border font-heading text-xs uppercase tracking-widest transition-all ${variantClass} ${props.className || ''}`}
    />
  );
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function sortItems(items, sortBy, sortDirection, getSortableValue) {
  return [...items].sort((left, right) => {
    const leftValue = getSortableValue(left, sortBy);
    const rightValue = getSortableValue(right, sortBy);

    const normalizedLeft = typeof leftValue === 'string' ? leftValue.toLowerCase() : leftValue;
    const normalizedRight = typeof rightValue === 'string' ? rightValue.toLowerCase() : rightValue;

    if (normalizedLeft < normalizedRight) {
      return sortDirection === 'asc' ? -1 : 1;
    }

    if (normalizedLeft > normalizedRight) {
      return sortDirection === 'asc' ? 1 : -1;
    }

    return 0;
  });
}

function paginateItems(items, page, pageSize) {
  const startIndex = (page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

function TableControls({ controls, searchPlaceholder, sortOptions, onSearchChange, onSortChange, onDirectionChange, onPageSizeChange }) {
  return (
    <div className="flex flex-col xl:flex-row gap-3 xl:items-end xl:justify-between">
      <div className="w-full xl:max-w-sm">
        <AdminInput
          label="Search"
          value={controls.search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-40">
          <AdminSelect label="Sort By" value={controls.sortBy} onChange={(event) => onSortChange(event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AdminSelect>
        </div>
        <div className="min-w-32">
          <AdminSelect label="Direction" value={controls.sortDirection} onChange={(event) => onDirectionChange(event.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </AdminSelect>
        </div>
        <div className="min-w-28">
          <AdminSelect label="Page Size" value={controls.pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </AdminSelect>
        </div>
      </div>
    </div>
  );
}

function PaginationControls({ page, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
      <div className="text-textMuted font-data text-xs">
        Page {totalPages === 0 ? 0 : page} of {totalPages}
      </div>
      <div className="flex gap-2">
        <ActionButton type="button" variant="ghost" disabled={page <= 1} className={page <= 1 ? 'opacity-50 cursor-not-allowed' : ''} onClick={() => onPageChange(page - 1)}>
          Previous
        </ActionButton>
        <ActionButton type="button" variant="ghost" disabled={page >= totalPages} className={page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''} onClick={() => onPageChange(page + 1)}>
          Next
        </ActionButton>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ item, onCancel, onConfirm }) {
  if (!item) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="glass-card w-full max-w-md">
        <h3 className="font-heading text-xl text-danger mb-3">Confirm Delete</h3>
        <p className="text-textMain font-body leading-relaxed">
          Delete <span className="text-danger font-semibold">{item.name}</span> from the {item.label.toLowerCase()} registry? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <ActionButton type="button" variant="ghost" onClick={onCancel}>Cancel</ActionButton>
          <ActionButton type="button" variant="danger" onClick={onConfirm}>Delete</ActionButton>
        </div>
      </div>
    </div>
  );
}

function LoginPanel({ loginForm, onChange, onSubmit, loginLoading, errorMessage }) {
  return (
    <div className="max-w-xl mx-auto pt-10">
      <AdminSection title="Admin Authentication">
        <div className="space-y-4">
          <p className="text-textMuted font-data text-sm">
            Sign in to unlock create, update, and delete access for DroneScope AI.
          </p>
          {errorMessage ? (
            <div className="border border-danger/50 bg-danger/10 text-danger px-4 py-3 rounded font-data text-sm">
              {errorMessage}
            </div>
          ) : null}
          <form className="grid grid-cols-1 gap-4" onSubmit={onSubmit}>
            <AdminInput label="Username" value={loginForm.username} onChange={(event) => onChange({ ...loginForm, username: event.target.value })} required />
            <AdminInput label="Password" type="password" value={loginForm.password} onChange={(event) => onChange({ ...loginForm, password: event.target.value })} required />
            <ActionButton type="submit" disabled={loginLoading} className={loginLoading ? 'opacity-60 cursor-not-allowed' : ''}>
              {loginLoading ? 'Signing In...' : 'Sign In'}
            </ActionButton>
          </form>
          <div className="text-textMuted font-data text-xs">
            Default local credentials: <span className="text-textMain">admin / admin123</span>
          </div>
        </div>
      </AdminSection>
    </div>
  );
}

export default function AdminPanel() {
  const [drones, setDrones] = useState([]);
  const [countries, setCountries] = useState([]);
  const [counterSystems, setCounterSystems] = useState([]);
  const [droneForm, setDroneForm] = useState(emptyDrone);
  const [countryForm, setCountryForm] = useState(emptyCountry);
  const [counterForm, setCounterForm] = useState(emptyCounter);
  const [editingDroneId, setEditingDroneId] = useState(null);
  const [editingCountryId, setEditingCountryId] = useState(null);
  const [editingCounterId, setEditingCounterId] = useState(null);
  const [status, setStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState({
    drone: false,
    country: false,
    counter: false,
  });
  const [droneTable, setDroneTable] = useState(defaultTableControls);
  const [countryTable, setCountryTable] = useState({ ...defaultTableControls, sortBy: 'code' });
  const [counterTable, setCounterTable] = useState(defaultTableControls);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAdminToken()));
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(Boolean(getAdminToken()));
  const [pendingDelete, setPendingDelete] = useState(null);

  const countryOptions = useMemo(
    () => countries.map((country) => country.code || country.name),
    [countries]
  );

  const visibleDrones = useMemo(() => {
    const query = droneTable.search.trim().toLowerCase();
    const filtered = drones.filter((drone) =>
      !query ||
      [drone.name, drone.country, drone.type, drone.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );

    return sortItems(filtered, droneTable.sortBy, droneTable.sortDirection, (drone, sortBy) => {
      if (sortBy === 'price_usd') return drone.specs?.price_usd || 0;
      return drone[sortBy] || '';
    });
  }, [drones, droneTable]);

  const visibleCountries = useMemo(() => {
    const query = countryTable.search.trim().toLowerCase();
    const filtered = countries.filter((country) =>
      !query ||
      [country.name, country.code, country.specialization, ...(country.top_drones || [])]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );

    return sortItems(filtered, countryTable.sortBy, countryTable.sortDirection, (country, sortBy) => country[sortBy] || '');
  }, [countries, countryTable]);

  const visibleCounterSystems = useMemo(() => {
    const query = counterTable.search.trim().toLowerCase();
    const filtered = counterSystems.filter((counterSystem) =>
      !query ||
      [counterSystem.name, counterSystem.type, counterSystem.effectiveness, counterSystem.description, ...(counterSystem.effective_against || [])]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );

    return sortItems(filtered, counterTable.sortBy, counterTable.sortDirection, (counterSystem, sortBy) => counterSystem[sortBy] || '');
  }, [counterSystems, counterTable]);

  const paginatedDrones = useMemo(
    () => paginateItems(visibleDrones, droneTable.page, droneTable.pageSize),
    [visibleDrones, droneTable.page, droneTable.pageSize]
  );
  const paginatedCountries = useMemo(
    () => paginateItems(visibleCountries, countryTable.page, countryTable.pageSize),
    [visibleCountries, countryTable.page, countryTable.pageSize]
  );
  const paginatedCounterSystems = useMemo(
    () => paginateItems(visibleCounterSystems, counterTable.page, counterTable.pageSize),
    [visibleCounterSystems, counterTable.page, counterTable.pageSize]
  );

  const droneTotalPages = Math.max(1, Math.ceil(visibleDrones.length / droneTable.pageSize));
  const countryTotalPages = Math.max(1, Math.ceil(visibleCountries.length / countryTable.pageSize));
  const counterTotalPages = Math.max(1, Math.ceil(visibleCounterSystems.length / counterTable.pageSize));

  async function loadAllData() {
    const [droneData, countryData, counterData] = await Promise.all([
      getDrones(),
      getCountries(),
      getCounterSystems(),
    ]);
    setDrones(droneData);
    setCountries(countryData);
    setCounterSystems(counterData);
  }

  useEffect(() => {
    loadAllData().catch((error) => setErrorMessage(normalizeError(error, 'Failed to load admin data.')));
  }, []);

  useEffect(() => {
    const token = getAdminToken();

    if (!token) {
      setAuthChecking(false);
      setIsAuthenticated(false);
      return;
    }

    getAdminSession()
      .then(() => {
        setIsAuthenticated(true);
      })
      .catch(() => {
        clearAdminToken();
        setIsAuthenticated(false);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  useEffect(() => {
    setDroneTable((current) => ({ ...current, page: Math.min(current.page, droneTotalPages) }));
  }, [droneTotalPages]);

  useEffect(() => {
    setCountryTable((current) => ({ ...current, page: Math.min(current.page, countryTotalPages) }));
  }, [countryTotalPages]);

  useEffect(() => {
    setCounterTable((current) => ({ ...current, page: Math.min(current.page, counterTotalPages) }));
  }, [counterTotalPages]);



  const fillDroneForm = (drone) => {
    setEditingDroneId(drone._id);
    setDroneForm({
      name: drone.name,
      country: drone.country,
      type: drone.type,
      description: drone.description || '',
      specs: { ...drone.specs },
      image: drone.image || '',
      model_url: drone.model_url || '',
    });
    setErrorMessage('');
  };

  function fillCountryForm(country) {
    setEditingCountryId(country._id);
    setCountryForm({
      name: country.name,
      code: country.code,
      drone_count: country.drone_count || 0,
      specialization: country.specialization || '',
      top_drones: (country.top_drones || []).join(', '),
      lat: country.lat || 0,
      lng: country.lng || 0,
      growth_rate: country.growth_rate || 0,
    });
  }

  function fillCounterForm(counterSystem) {
    setEditingCounterId(counterSystem._id);
    setCounterForm({
      name: counterSystem.name,
      type: counterSystem.type,
      effective_against: (counterSystem.effective_against || []).join(', '),
      range_km: counterSystem.range_km || 0,
      effectiveness: counterSystem.effectiveness,
      description: counterSystem.description || '',
    });
  }

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoginLoading(true);
      setErrorMessage('');
      const response = await loginAdmin(loginForm);
      setAdminToken(response.token);
      setIsAuthenticated(true);
      setStatus('Admin access granted.');
    } catch (error) {
      setErrorMessage(normalizeError(error, 'Unable to sign in.'));
      setStatus('');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    clearAdminToken();
    setIsAuthenticated(false);
    setStatus('');
    setErrorMessage('');
    setPendingDelete(null);
  }

  async function handleDroneSubmit(event) {
    event.preventDefault();
    const validationError = validateDroneForm(droneForm);
    if (validationError) {
      setErrorMessage(validationError);
      setStatus('');
      return;
    }

    const payload = {
      ...droneForm,
      specs: Object.fromEntries(
        Object.entries(droneForm.specs).map(([key, value]) => [key, Number(value)])
      ),
    };

    try {
      setSubmitting((current) => ({ ...current, drone: true }));
      setErrorMessage('');
      if (editingDroneId) {
        await updateDrone(editingDroneId, payload);
        setStatus('Drone updated.');
      } else {
        await createDrone(payload);
        setStatus('Drone created.');
      }

      setDroneForm(emptyDrone);
      setEditingDroneId(null);
      await loadAllData();
    } catch (error) {
      if (error?.response?.status === 401) {
        handleLogout();
      }
      setErrorMessage(normalizeError(error, 'Failed to save drone.'));
      setStatus('');
    } finally {
      setSubmitting((current) => ({ ...current, drone: false }));
    }
  }

  async function handleCountrySubmit(event) {
    event.preventDefault();
    const validationError = validateCountryForm(countryForm);
    if (validationError) {
      setErrorMessage(validationError);
      setStatus('');
      return;
    }

    const payload = {
      ...countryForm,
      code: countryForm.code.trim().toUpperCase(),
      drone_count: Number(countryForm.drone_count),
      lat: Number(countryForm.lat),
      lng: Number(countryForm.lng),
      growth_rate: Number(countryForm.growth_rate),
      top_drones: parseList(countryForm.top_drones),
    };

    try {
      setSubmitting((current) => ({ ...current, country: true }));
      setErrorMessage('');
      if (editingCountryId) {
        await updateCountry(editingCountryId, payload);
        setStatus('Country updated.');
      } else {
        await createCountry(payload);
        setStatus('Country created.');
      }

      setCountryForm(emptyCountry);
      setEditingCountryId(null);
      await loadAllData();
    } catch (error) {
      if (error?.response?.status === 401) {
        handleLogout();
      }
      setErrorMessage(normalizeError(error, 'Failed to save country.'));
      setStatus('');
    } finally {
      setSubmitting((current) => ({ ...current, country: false }));
    }
  }

  async function handleCounterSubmit(event) {
    event.preventDefault();
    const validationError = validateCounterForm(counterForm);
    if (validationError) {
      setErrorMessage(validationError);
      setStatus('');
      return;
    }

    const payload = {
      ...counterForm,
      range_km: Number(counterForm.range_km),
      effective_against: parseList(counterForm.effective_against),
    };

    try {
      setSubmitting((current) => ({ ...current, counter: true }));
      setErrorMessage('');
      if (editingCounterId) {
        await updateCounterSystem(editingCounterId, payload);
        setStatus('Counter system updated.');
      } else {
        await createCounterSystem(payload);
        setStatus('Counter system created.');
      }

      setCounterForm(emptyCounter);
      setEditingCounterId(null);
      await loadAllData();
    } catch (error) {
      if (error?.response?.status === 401) {
        handleLogout();
      }
      setErrorMessage(normalizeError(error, 'Failed to save counter system.'));
      setStatus('');
    } finally {
      setSubmitting((current) => ({ ...current, counter: false }));
    }
  }

  function requestDelete(action, id, label, name) {
    setPendingDelete({ action, id, label, name });
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      setErrorMessage('');
      await pendingDelete.action(pendingDelete.id);
      setStatus(`${pendingDelete.label} deleted.`);
      setPendingDelete(null);
      await loadAllData();
    } catch (error) {
      if (error?.response?.status === 401) {
        handleLogout();
      }
      setErrorMessage(normalizeError(error, `Failed to delete ${pendingDelete.label.toLowerCase()}.`));
      setStatus('');
      setPendingDelete(null);
    }
  }

  function updateTableControls(setter, updates) {
    setter((current) => ({
      ...current,
      ...updates,
      page: updates.page || 1,
    }));
  }

  if (authChecking) {
    return (
      <div className="flex items-center justify-center h-full font-data text-textMuted">
        Verifying admin session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPanel
        loginForm={loginForm}
        onChange={setLoginForm}
        onSubmit={handleLogin}
        loginLoading={loginLoading}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <DeleteConfirmationModal
        item={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl tracking-wider">Admin Control Center</h1>
          <p className="text-textMuted font-data text-sm mt-1">Protected workspace for managing countries, drones, and counter systems.</p>
        </div>
        <div className="flex items-center gap-3">
          {status ? <div className="text-success font-data text-sm">{status}</div> : null}
          <ActionButton type="button" variant="ghost" onClick={handleLogout}>Logout</ActionButton>
        </div>
      </div>
      {errorMessage ? (
        <div className="border border-danger/50 bg-danger/10 text-danger px-4 py-3 rounded font-data text-sm">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AdminSection title="Drone Registry">
          <form className="space-y-6 mb-8" onSubmit={handleDroneSubmit}>
            {/* Basic Info */}
            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-4 shadow-inner">
              <h4 className="font-heading text-xs uppercase tracking-widest text-neon flex items-center gap-2 border-b border-white/5 pb-2"><Layout size={14} /> Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AdminInput label="Name" value={droneForm.name} onChange={(event) => setDroneForm({ ...droneForm, name: event.target.value })} required />
                <AdminSelect label="Country" value={droneForm.country} onChange={(event) => setDroneForm({ ...droneForm, country: event.target.value })} required>
                  <option value="">Select country</option>
                  {countryOptions.map((country) => <option key={country} value={country}>{country}</option>)}
                </AdminSelect>
                <AdminSelect label="Type" value={droneForm.type} onChange={(event) => setDroneForm({ ...droneForm, type: event.target.value })}>
                  {droneTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </AdminSelect>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-4 shadow-inner">
              <h4 className="font-heading text-xs uppercase tracking-widest text-neon flex items-center gap-2 border-b border-white/5 pb-2"><Activity size={14} /> Performance Specifications</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <AdminInput label="Price USD" type="number" value={droneForm.specs.price_usd} onChange={(event) => setDroneForm({ ...droneForm, specs: { ...droneForm.specs, price_usd: event.target.value } })} required />
                <AdminInput label="Range KM" type="number" value={droneForm.specs.range_km} onChange={(event) => setDroneForm({ ...droneForm, specs: { ...droneForm.specs, range_km: event.target.value } })} required />
                <AdminInput label="Endurance HR" type="number" step="0.1" value={droneForm.specs.endurance_hr} onChange={(event) => setDroneForm({ ...droneForm, specs: { ...droneForm.specs, endurance_hr: event.target.value } })} required />
                <AdminInput label="Payload KG" type="number" step="0.1" value={droneForm.specs.payload_kg} onChange={(event) => setDroneForm({ ...droneForm, specs: { ...droneForm.specs, payload_kg: event.target.value } })} required />
                <AdminInput label="Speed KMH" type="number" value={droneForm.specs.speed_kmh} onChange={(event) => setDroneForm({ ...droneForm, specs: { ...droneForm.specs, speed_kmh: event.target.value } })} required />
                <AdminInput label="Maintenance/Hr" type="number" value={droneForm.specs.maintenance_cost_per_hr} onChange={(event) => setDroneForm({ ...droneForm, specs: { ...droneForm.specs, maintenance_cost_per_hr: event.target.value } })} required />
              </div>
            </div>
            
            {/* Media */}
            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-4 shadow-inner">
              <h4 className="font-heading text-xs uppercase tracking-widest text-neon flex items-center gap-2 border-b border-white/5 pb-2"><Layers size={14} /> Intelligence Assets</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminInput label="Image URL (Standardized)" value={droneForm.image} onChange={(event) => setDroneForm({ ...droneForm, image: event.target.value })} placeholder="/images/drones/model.jpg" />
                <AdminInput label="3D Model URL (.glb)" value={droneForm.model_url} onChange={(event) => setDroneForm({ ...droneForm, model_url: event.target.value })} placeholder="/models/drone.glb" />
              </div>
            </div>
            
            {/* Description */}
            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-4 shadow-inner">
              <h4 className="font-heading text-xs uppercase tracking-widest text-neon flex items-center gap-2 border-b border-white/5 pb-2"><Brain size={14} /> Executive Description</h4>
              <AdminTextarea label="Description" value={droneForm.description} onChange={(event) => setDroneForm({ ...droneForm, description: event.target.value })} />
            </div>

            {/* Live Card Preview */}
            <div className="bg-black/30 p-5 rounded-xl border border-neon/20 shadow-[0_0_15px_rgba(0,255,255,0.05)]">
              <h4 className="font-heading text-xs uppercase tracking-[0.2em] mb-4 text-neon flex items-center justify-center gap-2">
                <Layout size={14} /> Global Registry Preview
              </h4>
              <div className="max-w-sm mx-auto">
                 <DroneCard drone={droneForm} index={0} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <ActionButton type="button" variant="ghost" onClick={() => { setDroneForm(emptyDrone); setEditingDroneId(null); }}>Clear Form</ActionButton>
              <ActionButton type="submit" disabled={submitting.drone} className={submitting.drone ? 'opacity-60 cursor-not-allowed' : 'bg-neon/10 border-neon hover:bg-neon hover:text-black'}>
                {submitting.drone ? 'Saving...' : editingDroneId ? 'Update Platform' : 'Create Platform'}
              </ActionButton>
            </div>
          </form>
          <TableControls
            controls={droneTable}
            searchPlaceholder="Search by name, country, or type"
            sortOptions={[
              { value: 'name', label: 'Name' },
              { value: 'country', label: 'Country' },
              { value: 'type', label: 'Type' },
              { value: 'price_usd', label: 'Price' },
            ]}
            onSearchChange={(value) => updateTableControls(setDroneTable, { search: value })}
            onSortChange={(value) => updateTableControls(setDroneTable, { sortBy: value })}
            onDirectionChange={(value) => updateTableControls(setDroneTable, { sortDirection: value })}
            onPageSizeChange={(value) => updateTableControls(setDroneTable, { pageSize: value })}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-data">
              <thead className="text-textMuted">
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Country</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDrones.map((drone) => (
                  <tr key={drone._id} className="border-t border-white/5">
                    <td className="py-3">{drone.name}</td>
                    <td>{drone.country}</td>
                    <td>{drone.type}</td>
                    <td className="py-3 flex gap-2">
                      <ActionButton type="button" variant="ghost" onClick={() => fillDroneForm(drone)}>Edit</ActionButton>
                      <ActionButton type="button" variant="danger" onClick={() => requestDelete(deleteDrone, drone._id, 'Drone', drone.name)}>Delete</ActionButton>
                    </td>
                  </tr>
                ))}
                {paginatedDrones.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-textMuted">No drones match the current filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <PaginationControls page={droneTable.page} totalPages={droneTotalPages} onPageChange={(page) => updateTableControls(setDroneTable, { page })} />
        </AdminSection>

        <AdminSection title="Country Registry">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCountrySubmit}>
            <AdminInput label="Name" value={countryForm.name} onChange={(event) => setCountryForm({ ...countryForm, name: event.target.value })} required />
            <AdminInput label="Code" value={countryForm.code} onChange={(event) => setCountryForm({ ...countryForm, code: event.target.value.toUpperCase() })} required />
            <AdminInput label="Drone Count" type="number" value={countryForm.drone_count} onChange={(event) => setCountryForm({ ...countryForm, drone_count: event.target.value })} required />
            <AdminInput label="Growth Rate" type="number" value={countryForm.growth_rate} onChange={(event) => setCountryForm({ ...countryForm, growth_rate: event.target.value })} required />
            <AdminInput label="Latitude" type="number" step="0.0001" value={countryForm.lat} onChange={(event) => setCountryForm({ ...countryForm, lat: event.target.value })} required />
            <AdminInput label="Longitude" type="number" step="0.0001" value={countryForm.lng} onChange={(event) => setCountryForm({ ...countryForm, lng: event.target.value })} required />
            <div className="md:col-span-2">
              <AdminInput label="Top Drones" value={countryForm.top_drones} onChange={(event) => setCountryForm({ ...countryForm, top_drones: event.target.value })} placeholder="MQ-9 Reaper, Global Hawk" />
            </div>
            <div className="md:col-span-2">
              <AdminTextarea label="Specialization" value={countryForm.specialization} onChange={(event) => setCountryForm({ ...countryForm, specialization: event.target.value })} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <ActionButton type="submit" disabled={submitting.country} className={submitting.country ? 'opacity-60 cursor-not-allowed' : ''}>
                {submitting.country ? 'Saving...' : editingCountryId ? 'Update Country' : 'Create Country'}
              </ActionButton>
              <ActionButton type="button" variant="ghost" onClick={() => { setCountryForm(emptyCountry); setEditingCountryId(null); }}>Clear</ActionButton>
            </div>
          </form>
          <TableControls
            controls={countryTable}
            searchPlaceholder="Search by code, name, or specialization"
            sortOptions={[
              { value: 'code', label: 'Code' },
              { value: 'name', label: 'Name' },
              { value: 'drone_count', label: 'Drone Count' },
              { value: 'growth_rate', label: 'Growth Rate' },
            ]}
            onSearchChange={(value) => updateTableControls(setCountryTable, { search: value })}
            onSortChange={(value) => updateTableControls(setCountryTable, { sortBy: value })}
            onDirectionChange={(value) => updateTableControls(setCountryTable, { sortDirection: value })}
            onPageSizeChange={(value) => updateTableControls(setCountryTable, { pageSize: value })}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-data">
              <thead className="text-textMuted">
                <tr>
                  <th className="text-left py-2">Code</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Drones</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCountries.map((country) => (
                  <tr key={country._id} className="border-t border-white/5">
                    <td className="py-3">{country.code}</td>
                    <td>{country.name}</td>
                    <td>{country.drone_count}</td>
                    <td className="py-3 flex gap-2">
                      <ActionButton type="button" variant="ghost" onClick={() => fillCountryForm(country)}>Edit</ActionButton>
                      <ActionButton type="button" variant="danger" onClick={() => requestDelete(deleteCountry, country._id, 'Country', country.name)}>Delete</ActionButton>
                    </td>
                  </tr>
                ))}
                {paginatedCountries.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-textMuted">No countries match the current filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <PaginationControls page={countryTable.page} totalPages={countryTotalPages} onPageChange={(page) => updateTableControls(setCountryTable, { page })} />
        </AdminSection>

        <div className="xl:col-span-2">
          <AdminSection title="Counter-System Registry">
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleCounterSubmit}>
              <AdminInput label="Name" value={counterForm.name} onChange={(event) => setCounterForm({ ...counterForm, name: event.target.value })} required />
              <AdminSelect label="Type" value={counterForm.type} onChange={(event) => setCounterForm({ ...counterForm, type: event.target.value })}>
                {counterTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </AdminSelect>
              <AdminSelect label="Effectiveness" value={counterForm.effectiveness} onChange={(event) => setCounterForm({ ...counterForm, effectiveness: event.target.value })}>
                {effectivenessLevels.map((level) => <option key={level} value={level}>{level}</option>)}
              </AdminSelect>
              <AdminInput label="Effective Against" value={counterForm.effective_against} onChange={(event) => setCounterForm({ ...counterForm, effective_against: event.target.value })} placeholder="Swarm, Nano, Tactical" />
              <AdminInput label="Range KM" type="number" value={counterForm.range_km} onChange={(event) => setCounterForm({ ...counterForm, range_km: event.target.value })} required />
              <div className="md:col-span-3">
                <AdminTextarea label="Description" value={counterForm.description} onChange={(event) => setCounterForm({ ...counterForm, description: event.target.value })} required />
              </div>
              <div className="md:col-span-3 flex gap-3">
                <ActionButton type="submit" disabled={submitting.counter} className={submitting.counter ? 'opacity-60 cursor-not-allowed' : ''}>
                  {submitting.counter ? 'Saving...' : editingCounterId ? 'Update Counter' : 'Create Counter'}
                </ActionButton>
                <ActionButton type="button" variant="ghost" onClick={() => { setCounterForm(emptyCounter); setEditingCounterId(null); }}>Clear</ActionButton>
              </div>
            </form>
            <TableControls
              controls={counterTable}
              searchPlaceholder="Search by name, type, or threat"
              sortOptions={[
                { value: 'name', label: 'Name' },
                { value: 'type', label: 'Type' },
                { value: 'effectiveness', label: 'Effectiveness' },
                { value: 'range_km', label: 'Range' },
              ]}
              onSearchChange={(value) => updateTableControls(setCounterTable, { search: value })}
              onSortChange={(value) => updateTableControls(setCounterTable, { sortBy: value })}
              onDirectionChange={(value) => updateTableControls(setCounterTable, { sortDirection: value })}
              onPageSizeChange={(value) => updateTableControls(setCounterTable, { pageSize: value })}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-data">
                <thead className="text-textMuted">
                  <tr>
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Effectiveness</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCounterSystems.map((counterSystem) => (
                    <tr key={counterSystem._id} className="border-t border-white/5">
                      <td className="py-3">{counterSystem.name}</td>
                      <td>{counterSystem.type}</td>
                      <td>{counterSystem.effectiveness}</td>
                      <td className="py-3 flex gap-2">
                        <ActionButton type="button" variant="ghost" onClick={() => fillCounterForm(counterSystem)}>Edit</ActionButton>
                        <ActionButton type="button" variant="danger" onClick={() => requestDelete(deleteCounterSystem, counterSystem._id, 'Counter system', counterSystem.name)}>Delete</ActionButton>
                      </td>
                    </tr>
                  ))}
                  {paginatedCounterSystems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-textMuted">No counter systems match the current filters.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <PaginationControls page={counterTable.page} totalPages={counterTotalPages} onPageChange={(page) => updateTableControls(setCounterTable, { page })} />
          </AdminSection>
        </div>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { apiRequest } from "../apiClient";
import { login, register, type AppUser } from "../authService";
import type { BedOrder, Review } from "../types";

type Mode = "login" | "register";
type Props = { mode: Mode; onAuthenticated: (user: AppUser) => void };

function errorMessage(error: unknown) {
  if (!(error instanceof Error))
    return "Something went wrong. Please try again.";
  try {
    return (
      JSON.parse(error.message).detail ||
      "Something went wrong. Please try again."
    );
  } catch {
    return error.message || "Something went wrong. Please try again.";
  }
}

export function AuthExperience({ mode: initialMode, onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setMode(initialMode), [initialMode]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register")
        await register({ full_name: name, email, password });
      const token = await login(email, password);
      const user = await apiRequest<AppUser>("/api/v1/auth/me");
      onAuthenticated(user);
      window.location.assign(token.role === "system_admin" || token.role === "hospital_admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const registering = mode === "register";
  return (
    <main className="auth-page">
      <div className="auth-grid" />
      <section className="auth-intro">
        <div className="auth-brand">
          <div className="logo-mark">
            <Plus size={23} strokeWidth={2.6} />
          </div>
          <div>
            <strong>MedSync</strong>
            <span>AI Operations Command Center</span>
          </div>
        </div>
        <div className="auth-intro-copy">
          <span className="eyebrow">Secure clinical operations</span>
          <h1>
            Bring clarity to every <span>critical decision.</span>
          </h1>
          <p>
            One protected workspace for hospital leaders to understand demand,
            coordinate capacity, and respond early.
          </p>
        </div>
        <div className="auth-benefits">
          <div>
            <Activity size={17} />
            <span>
              <strong>Live operational intelligence</strong>
              <small>
                Capacity, patient flow, and demand signals in one place.
              </small>
            </span>
          </div>
          <div>
            <ShieldCheck size={17} />
            <span>
              <strong>Role-aware access</strong>
              <small>
                Users and workspace access are managed by your administrators.
              </small>
            </span>
          </div>
        </div>
      </section>
      <section className="auth-panel-wrap">
        <div className="auth-panel">
          <div className="auth-panel-head">
            <div className="auth-icon">
              <LockKeyhole size={18} />
            </div>
            <span className="eyebrow">
              {registering ? "Create your workspace access" : "Welcome back"}
            </span>
            <h2>{registering ? "Create an account" : "Sign in to MedSync"}</h2>
            <p>
              {registering
                ? "Register to start using the command center."
                : "Enter your credentials to continue."}
            </p>
          </div>
          <form onSubmit={submit} className="auth-form">
            {registering && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Dr. Avery Chen"
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Work email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                placeholder="you@hospital.org"
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                type="password"
                minLength={6}
                placeholder="At least 6 characters"
                autoComplete={registering ? "new-password" : "current-password"}
              />
            </label>
            {registering && (
              <label>
                Confirm password
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  type="password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
              </label>
            )}
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary-button auth-submit" disabled={busy}>
              {busy ? (
                "Please wait…"
              ) : registering ? (
                <>
                  Create account <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            {registering ? "Already have an account?" : "New to MedSync?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(registering ? "login" : "register");
                setError("");
              }}
            >
              {registering ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

type AdminProps = { currentUser: AppUser };
export function AdminUsers({ currentUser }: AdminProps) {
  const [activeTab, setActiveTab] = useState<"users" | "bed-orders" | "reviews">("users");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [bedOrders, setBedOrders] = useState<BedOrder[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "operations_manager",
  });
  const admin = ["system_admin", "hospital_admin"].includes(currentUser.role);
  
  async function loadUsers() {
    try {
      setUsers(await apiRequest<AppUser[]>("/api/v1/admin/users"));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadBedOrders() {
    try {
      setBedOrders(await apiRequest<BedOrder[]>("/api/v1/admin/orders"));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadReviews() {
    try {
      setReviews(await apiRequest<Review[]>("/api/v1/admin/reviews"));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function load() {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadBedOrders(), loadReviews()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (admin) load();
  }, [admin]);

  async function add(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const user = await apiRequest<AppUser>("/api/v1/auth/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setUsers((items) =>
        [...items, user].sort((a, b) => a.full_name.localeCompare(b.full_name)),
      );
      setForm({
        full_name: "",
        email: "",
        password: "",
        role: "operations_manager",
      });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(user: AppUser) {
    if (!window.confirm(`Remove ${user.full_name}'s account?`)) return;
    setError("");
    try {
      await apiRequest<void>(`/api/v1/auth/users/${user.id}`, {
        method: "DELETE",
      });
      setUsers((items) => items.filter((item) => item.id !== user.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (!admin)
    return (
      <div className="empty-page">
        <span className="eyebrow">Access restricted</span>
        <h1>Administrator access required</h1>
        <p>Your account does not have permission to manage users.</p>
      </div>
    );

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Workspace administration</span>
          <h1>Admin Dashboard</h1>
          <p>
            Manage users, view bed orders, and monitor reviews.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div className="admin-count">
            <Users size={17} />
            <strong>{users.length}</strong>
            <span>users</span>
          </div>
          <div className="admin-count">
            <Activity size={17} />
            <strong>{bedOrders.length}</strong>
            <span>bed orders</span>
          </div>
          <div className="admin-count">
            <ShieldCheck size={17} />
            <strong>{reviews.length}</strong>
            <span>reviews</span>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "users" ? "tab active" : "tab"}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} /> Users
        </button>
        <button
          className={activeTab === "bed-orders" ? "tab active" : "tab"}
          onClick={() => setActiveTab("bed-orders")}
        >
          <Activity size={16} /> Bed Orders
        </button>
        <button
          className={activeTab === "reviews" ? "tab active" : "tab"}
          onClick={() => setActiveTab("reviews")}
        >
          <ShieldCheck size={16} /> Reviews
        </button>
      </div>

      {activeTab === "users" && (
        <div className="admin-layout">
          <section className="panel admin-users-panel">
            <div className="section-title">
              <div>
                <h2>Registered users</h2>
                <span>
                  {loading
                    ? "Loading user records…"
                    : "Accounts stored in the MedSync database"}
                </span>
              </div>
            </div>
            {error && <p className="auth-error">{error}</p>}
            <input aria-label="Search registered users" placeholder="Search by name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
            <div className="user-table">
              {!loading &&
                users.filter((user) => `${user.full_name} ${user.email}`.toLowerCase().includes(search.toLowerCase())).map((user) => (
                  <div className="user-row" key={user.id}>
                    <div className="user-avatar">
                      {user.full_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <strong>{user.full_name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <em>{user.role.replace("_", " ")}</em>
                    <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span>
                    <button
                      className="icon-button danger-button"
                      title={`Delete ${user.full_name}`}
                      onClick={() => remove(user)}
                      disabled={user.id === currentUser.id}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              {!loading && users.length === 0 && (
                <p className="admin-empty">No users registered yet.</p>
              )}
            </div>
          </section>
          <section className="panel add-user-panel">
            <div className="section-title">
              <div>
                <h2>Add a user</h2>
                <span>Create an account with the right role.</span>
              </div>
              <UserPlus size={18} className="teal-text" />
            </div>
            <form className="admin-form" onSubmit={add}>
              <label>
                Full name
                <input
                  value={form.full_name}
                  required
                  minLength={2}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </label>
              <label>
                Email address
                <input
                  value={form.email}
                  required
                  type="email"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label>
                Temporary password
                <input
                  value={form.password}
                  required
                  type="password"
                  minLength={6}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </label>
              <label>
                Role
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="operations_manager">Operations manager</option>
                  <option value="hospital_admin">Hospital administrator</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                </select>
              </label>
              <button className="primary-button wide">
                <UserPlus size={16} /> Add user
              </button>
            </form>
          </section>
        </div>
      )}

      {activeTab === "bed-orders" && (
        <section className="panel">
          <div className="section-title">
            <div>
              <h2>Bed Orders</h2>
              <span>{loading ? "Loading…" : `${bedOrders.length} total orders`}</span>
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px"
            }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(165,195,235,.12)" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>User</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Bed ID</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {!loading && bedOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid rgba(165,195,235,.08)" }}>
                    <td style={{ padding: "12px" }}>{order.id.slice(0, 8)}...</td>
                    <td style={{ padding: "12px" }}>{order.user_id.slice(0, 8)}...</td>
                    <td style={{ padding: "12px" }}>{order.bed_id.slice(0, 8)}...</td>
                    <td style={{ padding: "12px" }}>
                      <select value={order.status} onChange={async (event) => { const status = event.target.value; try { const updated = await apiRequest<BedOrder>(`/api/v1/admin/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setBedOrders((items) => items.map((item) => item.id === updated.id ? updated : item)); } catch (err) { setError(errorMessage(err)); } }} aria-label={`Update order ${order.id} status`}>
                        {['pending', 'approved', 'fulfilled', 'rejected'].map((status) => <option value={status} key={status}>{status}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && bedOrders.length === 0 && (
              <p className="admin-empty">No bed orders yet.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === "reviews" && (
        <section className="panel">
          <div className="section-title">
            <div>
              <h2>User Reviews</h2>
              <span>{loading ? "Loading…" : `${reviews.length} total reviews`}</span>
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {!loading && reviews.map((review) => (
              <div key={review.id} style={{
                padding: "14px",
                border: "1px solid rgba(165,195,235,.12)",
                borderRadius: "8px",
                background: "rgba(255,255,255,.02)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <strong style={{ fontSize: "12px" }}>★ {review.rating}/5</strong>
                  <span style={{ fontSize: "10px", color: "var(--dim)" }}>
                    {new Date(review.review_date).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ margin: "8px 0", fontSize: "12px", color: "var(--muted)", lineHeight: 1.5 }}>
                  {review.comment}
                </p>
                <span style={{ fontSize: "9px", color: "var(--dim)" }}>
                  By: {review.user_id.slice(0, 8)}...
                </span>
              </div>
            ))}
          </div>
          {!loading && reviews.length === 0 && (
            <p className="admin-empty">No reviews yet.</p>
          )}
        </section>
      )}
    </div>
  );
}

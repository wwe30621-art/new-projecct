<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { http } from "../api/http";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";

type Role = "user" | "admin";

type UserItem = {
  id: number;
  email: string;
  role: Role;
  created_at?: string;
};

const auth = useAuthStore();
const router = useRouter();
const users = ref<UserItem[]>([]);
const loading = ref(false);
const msg = ref("");
const err = ref("");

// ? UI state??? + ??
const q = ref(""); // email search
const roleFilter = ref<"all" | Role>("all");

async function fetchUsers() {
  loading.value = true;
  msg.value = "";
  err.value = "";
  try {
    const res = await http.get("/users?limit=50&offset=0");
    users.value = (res.data?.users ?? res.data) as UserItem[];
  } catch (e: any) {
    err.value = e?.response?.data?.message || e?.message || "Failed to load users";
  } finally {
    loading.value = false;
  }
}

// ? ????admin-only?
async function setRole(userId: number, role: Role) {
  msg.value = "";
  err.value = "";

  // ????????????
  if (!auth.me) return;

  // ???????????
  if (userId === auth.me.id) {
    err.value = "You cannot change your own role.";
    return;
  }

  try {
    await http.patch(`/users/${userId}/role`, { role });

    // ? ????????? users ???????
    const idx = users.value.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      const current = users.value[idx];
      if (current) {
        users.value[idx] = { ...current, role };
      }
    }

    msg.value = `Updated user ${userId} -> ${role}`;
  } catch (e: any) {
    err.value = e?.response?.data?.message || e?.message || "Update failed";
  }
}

// ? ?? filter??? + role?
const filteredUsers = computed(() => {
  const keyword = q.value.trim().toLowerCase();
  return users.value.filter((u) => {
    const okRole = roleFilter.value === "all" ? true : u.role === roleFilter.value;
    const okEmail = keyword ? u.email.toLowerCase().includes(keyword) : true;
    return okRole && okEmail;
  });
});

const totalCount = computed(() => users.value.length);
const shownCount = computed(() => filteredUsers.value.length);

onMounted(fetchUsers);

function fmtDate(v?: string) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}
function logout() {
  auth.logout();          // ? token + ? store
  router.push("/login");  // ??????
}


</script>

<template>
  <div style="max-width: 920px; margin: 40px auto; display: grid; gap: 14px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2>Admin</h2>
      <button @click="fetchUsers" :disabled="loading">Refresh</button>
      <button @click="logout">Logout</button>
    </div>

    <!-- ? ?? + ?? -->
    <div
      style="
        display: grid;
        gap: 10px;
        grid-template-columns: 1fr 200px auto;
        align-items: center;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
      "
    >
      <input
        v-model="q"
        placeholder="Search by email..."
        style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
      />

      <select
        v-model="roleFilter"
        style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
      >
        <option value="all">All roles</option>
        <option value="admin">admin</option>
        <option value="user">user</option>
      </select>

      <div style="justify-self: end; color: #666;">
        Showing <b>{{ shownCount }}</b> / <b>{{ totalCount }}</b>
      </div>
    </div>

    <p v-if="msg" style="color: green;">{{ msg }}</p>
    <p v-if="err" style="color: red;">{{ err }}</p>

    <div v-if="loading">Loading...</div>

    <div v-if="!loading && filteredUsers.length === 0" style="color: #666;">
      No users found.
    </div>

    <div
      v-for="u in filteredUsers"
      :key="u.id"
      style="
        padding: 14px;
        border: 1px solid #ddd;
        border-radius: 6px;
        display: grid;
        gap: 6px;
      "
    >
      <div><b>ID:</b> {{ u.id }}</div>
      <div><b>Email:</b> {{ u.email }}</div>
      <div><b>Role:</b> {{ u.role }}</div>
      <div v-if="u.created_at"><b>Created:</b> {{ fmtDate(u.created_at) }}</div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button
          @click="setRole(u.id, 'admin')"
          :disabled="loading || u.role === 'admin' || auth.me?.id === u.id"
        >
           admin
        </button>

        <button
          @click="setRole(u.id, 'user')"
          :disabled="loading || u.role === 'user' || auth.me?.id === u.id"
        >
           user
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const newEmail = ref("");
const newPassword = ref("");
const msg = ref("");
const err = ref("");

const logout = () => {
  auth.logout();
  router.push("/login");
};

onMounted(async () => {
  msg.value = "";
  err.value = "";
  try {
    await auth.fetchMe();
    newEmail.value = auth.me?.email ?? "";
  } catch {
    auth.logout();
    router.push("/login");
  }
});

async function updateEmail() {
  msg.value = "";
  err.value = "";
  try {
    await auth.updateMe({ email: newEmail.value.trim() });
    msg.value = "Email updated";
  } catch (e: any) {
    err.value = e?.response?.data?.message || e?.message || "Update failed";
  }
}

async function updatePassword() {
  msg.value = "";
  err.value = "";
  try {
    await auth.updateMe({ password: newPassword.value });
    newPassword.value = "";
    msg.value = "Password updated";
  } catch (e: any) {
    err.value = e?.response?.data?.message || e?.message || "Update failed";
  }
}
</script>

<template>
  <div style="max-width:720px;margin:40px auto;display:grid;gap:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h2>Me</h2>
      <button @click="logout">Logout</button>
    </div>

    <div v-if="auth.me" style="padding:12px;border:1px solid #ddd;">
      <div><b>ID:</b> {{ auth.me.id }}</div>
      <div><b>Email:</b> {{ auth.me.email }}</div>
      <div><b>Role:</b> {{ auth.me.role }}</div>
      <div v-if="auth.me.created_at"><b>Created:</b> {{ auth.me.created_at }}</div>
    </div>

    <div style="padding:12px;border:1px solid #ddd;display:grid;gap:10px;">
      <h3>Update Email</h3>
      <input v-model="newEmail" placeholder="new email" />
      <button @click="updateEmail">Save Email</button>
    </div>

    <div style="padding:12px;border:1px solid #ddd;display:grid;gap:10px;">
      <h3>Update Password</h3>
      <input v-model="newPassword" placeholder="new password" type="password" />
      <button @click="updatePassword">Save Password</button>
    </div>

    <p v-if="msg" style="color:green;">{{ msg }}</p>
    <p v-if="err" style="color:red;">{{ err }}</p>
  </div>
</template>

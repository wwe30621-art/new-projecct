<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const error = ref("");

async function onLogin() {
  error.value = "";

  try {
    await auth.login(email.value.trim(), password.value);

    // ✅ 依角色導向
    if (auth.me?.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/me");
    }
  } catch (e: any) {
    error.value =
      e?.response?.data?.message || e?.message || "Login failed";
  }
}
</script>


<template>
  <div style="max-width:420px;margin:40px auto;display:grid;gap:10px;">
    <h2>Login</h2>

    <input v-model="email" placeholder="email" />
    <input v-model="password" placeholder="password" type="password" />

    <button @click="onLogin">Login</button>

    <p v-if="error" style="color:red;">{{ error }}</p>
  </div>
</template>

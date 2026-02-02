<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <div style="max-width:720px;margin:60px auto;display:grid;gap:12px;">
    <h2>403 - Forbidden</h2>
    <p>你沒有權限存取此頁面。</p>
    <div style="display:flex;gap:10px;">
      <button @click="router.push('/me')">回到個人頁</button>
      <button @click="router.push('/login')">回到登入</button>
    </div>
  </div>
</template>

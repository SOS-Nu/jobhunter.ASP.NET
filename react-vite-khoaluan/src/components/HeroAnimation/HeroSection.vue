<!--file HeroSection.vue -->
<script setup lang="ts">
import HeroDiagram from "./HeroDiagram.vue";
</script>

<template>
  <div class="hero">
    <div class="container">
      <!-- Tagline -->
    </div>

    <!-- Animated Diagram -->
    <HeroDiagram />
  </div>
</template>

<style scoped>
.hero {
  /* --- PHẦN STYLE MỚI ĐỂ LÀM BACKGROUND --- */
  position: absolute;
  left: 0;
  width: 100%; /* Chiếm 100% chiều ngang */
  z-index: 0; /* Nằm dưới cùng (background) */

  /* --- Các style cũ của .hero --- */
  margin-bottom: 0;
  /* background-color: #101010; */

  /* 1. Màn Mobile (mặc định): 0px */
  top: 180px;

  /* 2. Màn Medium (768px) trở lên */
  @media (min-width: 768px) {
    top: 180px;
    /* margin-bottom: 60px; */
  }

  /* 3. Màn Lớn (ví dụ: 1024px) trở lên */
  @media (min-width: 1642px) {
    top: 200px;
  }
}
</style>

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'holiday-tracker' with your repository name if different
export default defineConfig({
  plugins: [react()],
  base: '/HolidayTracker/',
})

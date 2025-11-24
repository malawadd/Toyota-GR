<script setup>
const props = defineProps({
	isMobile: Boolean,
	sidebarOpen: Boolean
})

const emit = defineEmits(['toggle', 'closeOverlay'])

const toggleSidebar = () => {
	emit('toggle')
}

const closeOverlay = () => {
	emit('closeOverlay')
}
</script>

<template>
	<div v-if="isMobile">
		<!-- Mobile Overlay -->
		<div 
			v-if="sidebarOpen" 
			:class="$style.overlay" 
			@click="closeOverlay"
		/>

		<!-- Mobile Menu Button -->
		<button @click="toggleSidebar" :class="$style.mobileMenuBtn">
			<Icon name="chevron" size="20" color="primary" :rotate="sidebarOpen ? 90 : 0" />
		</button>
	</div>
</template>

<style module>
.overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	z-index: 999;
}

.mobileMenuBtn {
	position: fixed;
	top: 20px;
	left: 20px;
	z-index: 1001;
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 2px solid rgba(0, 255, 157, 0.3);
	border-radius: 8px;
	padding: 8px;
	transition: all 0.2s ease;
}

.mobileMenuBtn:hover {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.3) 0%, rgba(0, 0, 0, 0.9) 100%);
	box-shadow: 0 0 20px rgba(0, 255, 157, 0.3);
}
</style>
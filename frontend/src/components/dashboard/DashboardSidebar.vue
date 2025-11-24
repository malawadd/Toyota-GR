<script setup>
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

const props = defineProps({
	sidebarOpen: Boolean,
	isMobile: Boolean,
	dashboardPages: Array
})

const emit = defineEmits(['navigate', 'toggle'])

const route = useRoute()
const router = useRouter()

const navigateToPage = (pageKey) => {
	router.push(`/dashboard/${pageKey}`)
	emit('navigate', pageKey)
}

const toggleSidebar = () => {
	emit('toggle')
}
</script>

<template>
	<aside :class="[$style.sidebar, !sidebarOpen && $style.collapsed, isMobile && $style.mobile]">
		<div :class="$style.sidebarHeader">
			<Flex align="center" gap="12">
				<Icon name="logo" size="24" color="primary" />
				<Text v-if="sidebarOpen" size="16" weight="700" color="primary">Toyota GR Cup Series</Text>
			</Flex>
			<button v-if="!isMobile" @click="toggleSidebar" :class="$style.toggleBtn">
				<Icon name="chevron" size="16" color="secondary" :rotate="sidebarOpen ? 180 : 0" />
			</button>
		</div>

		<nav :class="$style.navigation">
			
			
			<div
				v-for="page in dashboardPages"
				:key="page.key"
				@click="navigateToPage(page.key)"
				:class="[$style.navItem, route.name === page.key && $style.active]"
			>
				<Icon :name="page.icon" size="16" color="secondary" />
				<Text v-if="sidebarOpen" size="13" weight="600" color="secondary">{{ page.name }}</Text>
			</div>
		</nav>

		<div v-if="sidebarOpen" :class="$style.sidebarFooter">
			<Text size="11" weight="500" color="support">SYSTEM STATUS: ONLINE</Text>
		</div>
	</aside>
</template>

<style module>
.sidebar {
	width: 280px;
	background: linear-gradient(180deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border-right: 2px solid rgba(0, 255, 157, 0.2);
	display: flex;
	flex-direction: column;
	transition: all 0.3s ease;
	position: relative;
	z-index: 1000;
}

.sidebar.collapsed {
	width: 70px;
}

.sidebar.mobile {
	position: fixed;
	height: 100vh;
	top: 0;
	left: 0;
	transform: translateX(0);
}

.sidebar.mobile.collapsed {
	transform: translateX(-100%);
	width: 280px;
}

.sidebarHeader {
	padding: 20px;
	border-bottom: 1px solid rgba(0, 255, 157, 0.1);
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.toggleBtn {
	background: rgba(0, 255, 157, 0.1);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 4px;
	padding: 6px;
	transition: all 0.2s ease;
}

.toggleBtn:hover {
	background: rgba(0, 255, 157, 0.2);
	box-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
}

.navigation {
	flex: 1;
	padding: 20px 0;
	overflow-y: auto;
}

.navSection {
	padding: 0 20px 12px;
	margin-bottom: 8px;
}

.navItem {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 20px;
	cursor: pointer;
	transition: all 0.2s ease;
	border-left: 3px solid transparent;
}

.navItem:hover {
	background: rgba(0, 255, 157, 0.05);
	border-left-color: rgba(0, 255, 157, 0.3);
}

.navItem.active {
	background: rgba(0, 255, 157, 0.1);
	border-left-color: #00ff9d;
	box-shadow: inset 0 0 20px rgba(0, 255, 157, 0.1);
}

.sidebarFooter {
	padding: 20px;
	border-top: 1px solid rgba(0, 255, 157, 0.1);
}
</style>
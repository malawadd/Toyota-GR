<script setup>
const props = defineProps({
	width: { type: String, default: '100%' },
	height: { type: String, default: '20px' },
	radius: { type: String, default: '4px' },
	variant: { type: String, default: 'rectangular' }
})
</script>

<template>
	<div
		:class="[$style.skeleton, $style[variant]]"
		:style="{ width, height, borderRadius: radius }"
	/>
</template>

<style module>
.skeleton {
	background: linear-gradient(
		90deg,
		rgba(255, 255, 255, 0.05) 0%,
		rgba(255, 255, 255, 0.1) 50%,
		rgba(255, 255, 255, 0.05) 100%
	);
	background-size: 200% 100%;
	animation: shimmer 1.5s infinite;
	border-radius: 4px;
}

.circular {
	border-radius: 50%;
}

.rectangular {
	border-radius: 4px;
}

@keyframes shimmer {
	0% {
		background-position: -200% 0;
	}
	100% {
		background-position: 200% 0;
	}
}
</style>

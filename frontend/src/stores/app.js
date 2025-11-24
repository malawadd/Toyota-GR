import { ref } from "vue"
import { defineStore } from "pinia"

export const useAppStore = defineStore("app", () => {
	const selectedVehicle = ref(null)
	const selectedClass = ref(null)
	const refreshInterval = ref(null)

	const setSelectedVehicle = (vehicle) => {
		selectedVehicle.value = vehicle
	}

	const setSelectedClass = (vehicleClass) => {
		selectedClass.value = vehicleClass
	}

	const clearSelection = () => {
		selectedVehicle.value = null
		selectedClass.value = null
	}

	return {
		selectedVehicle,
		selectedClass,
		refreshInterval,
		setSelectedVehicle,
		setSelectedClass,
		clearSelection
	}
})

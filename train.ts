//mitask zl
function printNumbers(): void {
	let count = 1;

	const interval = setInterval(() => {
		console.log(count);
		count++;

		if (count > 5) {
			clearInterval(interval);
		}
	}, 1000);
}

printNumbers();

//mitask zj

// function reduceNestedArray(arr: any[]): number {
// 	let sum = 0;

// 	for (let i = 0; i < arr.length; i++) {
// 		if (Array.isArray(arr[i])) {
// 			sum += reduceNestedArray(arr[i]);
// 		} else {
// 			sum += arr[i];
// 		}
// 	}

// 	return sum;
// }

// console.log(reduceNestedArray([1, [1, 2, [4]]]));

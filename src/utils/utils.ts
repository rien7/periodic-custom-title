export function cn(...args: (string | boolean | object)[]) {
		return args
				.filter(Boolean)
				.map((item) => {
						if (typeof item === 'object') {
								return Object.entries(item)
										.filter(([_, value]) => Boolean(value))
										.map(([key]) => key)
										.join(' ');
						}
						return item;
				})
				.join(' ');
}

export function chunk<T>(array: T[], size: number): T[][] {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

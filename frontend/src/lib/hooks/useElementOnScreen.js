import { useEffect, useState } from "react";

export default function useElementOnScreen(containerRef, once, isViewed) {
    const [isVisible, setIsVisible] = useState(false);

    const callback = (entries, observer) => {
        const [entry] = entries;
        if (isVisible !== entry.isIntersecting) {
            setIsVisible(entry.isIntersecting);

            if (entry.isIntersecting && once && (containerRef.current || entry.target)) {
                observer.unobserve(containerRef.current || entry.target);
                observer.disconnect();
            }
        }
    };

    useEffect(() => {
        if (isViewed) return;
        const curr = containerRef.current;
        if (!curr) return;

        const observer = new IntersectionObserver((entries) => callback(entries, observer));
        if (curr) observer.observe(curr);

        return () => {
            if (curr) {
                observer.unobserve(curr);
                observer.disconnect();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return isVisible;
}
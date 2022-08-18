import { useEffect, useState } from "react";

export default function useElementOnScreen(containerRef, once, isViewed) {
    const [isVisible, setIsVisible] = useState(false);

    const callback = (entries, observer) => {
        const [entry] = entries;
        if (isVisible !== entry.isIntersecting) {
            setIsVisible(entry.isIntersecting);
            if (entry.isIntersecting && once && containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        }
    };

    useEffect(() => {
        if (isViewed) return;
        const observer = new IntersectionObserver((entries) => callback(entries, observer));
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return isVisible;
}
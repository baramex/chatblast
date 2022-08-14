import { useEffect, useState } from "react";

export default function useElementOnScreen(containerRef, once, options) {
    const [isVisible, setIsVisible] = useState(false);

    const callback = (entries, observer) => {
        const [entry] = entries;
        if (isVisible !== entry.isIntersecting) {
            setIsVisible(entry.isIntersecting);
            if (entry.isIntersecting && once) observer.unobserve(containerRef.current);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => callback(entries, observer), options);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerRef, options]);

    return isVisible;
}
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function Dropmenu({ items, className = "", children }) {
    return (
        <Menu as="div" className={className + " relative"}>
            <Menu.Button>
                {children}
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        {
                            items.map((item, i) =>
                                <Menu.Item key={i}>
                                    <button onClick={item.onClick} className={`${item.textColor || "text-gray-700"} block px-3 py-2 text-sm flex gap-2 hover:bg-gray-100 ${item.hoverTextColor || "hover:text-color-900"} w-full`}><item.Icon className={item.iconStyle || ""} width="20" />{item.text}</button>
                                </Menu.Item>
                            )
                        }
                    </div>
                </Menu.Items>
            </Transition>
        </Menu >
    );
}
import { Fragment } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { useRealtimeNotifications, type NotificationItem } from '../../contexts/RealtimeNotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

import { useLocation, useParams } from 'react-router-dom';

export function NotificationDrawer() {
  const location = useLocation();
  const { slug } = useParams();
  
  const { 
    isOpen, 
    setIsOpen, 
    notifications, 
    unreadCount, 
    activeTab, 
    setActiveTab,
    handleNotificationClick,
    clearAll
  } = useRealtimeNotifications();

  // Filter notifications by tab
  const requests = notifications.filter(n => n.type === 'request');
  const services = notifications.filter(n => n.type === 'service');
  const payments = notifications.filter(n => n.type === 'payment' || n.type === 'payment_success');

  const getUnreadCountByTab = (type: string) => notifications.filter(n => {
      if (type === 'payment') {
          return (n.type === 'payment' || n.type === 'payment_success') && !n.read;
      }
      return n.type === type && !n.read;
  }).length;

  const isHomePage = location.pathname === `/s/${slug}/staff`;

  const NotificationList = ({ items }: { items: NotificationItem[] }) => {
      // ... (keep existing implementation)
      if (items.length === 0) {
          return (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                  <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p>Không có thông báo nào</p>
              </div>
          );
      }

      return (
          <ul className="space-y-3">
              {items.map((item) => (
                  <li 
                    key={item.id} 
                    className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                        item.read 
                        ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750' 
                        : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                    }`}
                    onClick={() => handleNotificationClick(item)}
                  >
                        <div className="flex justify-between items-start">
                            <h4 className={`text-sm font-semibold ${item.read ? 'text-gray-900 dark:text-gray-100' : 'text-blue-700 dark:text-blue-300'}`}>
                                {item.tableName}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: vi })}
                            </span>
                        </div>
                        <p className={`mt-1 text-sm ${item.read ? 'text-gray-600 dark:text-gray-400' : 'text-blue-900 dark:text-blue-100'}`}>
                            {item.message}
                        </p>
                  </li>
              ))}
          </ul>
      );
  };

  return (
    <>
      {/* Floating Action Buffer (FAB) - Only show on HomePage */}
      {isHomePage && (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-transform active:scale-95"
      >
        <span className="sr-only">Thông báo</span>
        <div className="relative">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 ring-2 ring-red-600 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </div>
      </button>
      )}

      {/* Drawer */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300 sm:duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300 sm:duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-hidden bg-white dark:bg-gray-900 shadow-xl">
                      <div className="px-4 py-6 sm:px-6 bg-red-600 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-bold text-white">
                            Thông báo
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md text-white/70 hover:text-white focus:outline-none"
                              onClick={() => setIsOpen(false)}
                            >
                              <span className="sr-only">Đóng</span>
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tabs */}
                      <Tab.Group 
                        selectedIndex={activeTab === 'request' ? 0 : activeTab === 'service' ? 1 : 2}
                        onChange={(idx) => setActiveTab(idx === 0 ? 'request' : idx === 1 ? 'service' : 'payment')}
                      >
                         <Tab.List className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 px-4 pt-4">
                            {(['request', 'service', 'payment'] as const).map((key) => {
                                const labels = { request: 'Yêu cầu', service: 'Dịch vụ', payment: 'Thanh toán' };
                                const count = getUnreadCountByTab(key);
                                return (
                                    <Tab
                                        key={key}
                                        className={({ selected }) =>
                                        classNames(
                                            'w-full py-2.5 text-sm font-medium leading-5 relative outline-none',
                                            selected
                                            ? 'text-red-600 border-b-2 border-red-600 flex flex-col items-center gap-1 font-bold'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        )
                                        }
                                    >
                                        {labels[key]}
                                        {count > 0 && (
                                            <span className="absolute top-1 right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                                {count}
                                            </span>
                                        )}
                                    </Tab>
                                )
                            })}
                         </Tab.List>
                         
                          <Tab.Panels className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                            <Tab.Panel className="outline-none">
                                {getUnreadCountByTab('request') > 0 && (
                                    <div className="flex justify-end mb-2">
                                        <button 
                                            onClick={clearAll}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                            Đánh dấu là đã đọc
                                        </button>
                                    </div>
                                )}
                                <NotificationList items={requests} />
                            </Tab.Panel>
                            <Tab.Panel className="outline-none">
                                {getUnreadCountByTab('service') > 0 && (
                                    <div className="flex justify-end mb-2">
                                        <button 
                                            onClick={clearAll}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                            Đánh dấu là đã đọc
                                        </button>
                                    </div>
                                )}
                                <NotificationList items={services} />
                            </Tab.Panel>
                            <Tab.Panel className="outline-none">
                                {getUnreadCountByTab('payment') > 0 && (
                                    <div className="flex justify-end mb-2">
                                        <button 
                                            onClick={clearAll}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                            Đánh dấu là đã đọc
                                        </button>
                                    </div>
                                )}
                                <NotificationList items={payments} />
                            </Tab.Panel>
                          </Tab.Panels>
                      </Tab.Group>

                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

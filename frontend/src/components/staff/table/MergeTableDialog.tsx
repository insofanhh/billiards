import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../../api/orders';
import { tablesApi } from '../../../api/tables';
import { formatCurrency } from '../../../utils/format';
import type { Table } from '../../../types';
import toast from 'react-hot-toast';
import { useNotification } from '../../../contexts/NotificationContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sourceTable: Table;
  slug?: string;
}

export function MergeTableDialog({ isOpen, onClose, sourceTable, slug }: Props) {
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Tất cả');
  const inputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const { slug: routeSlug } = useParams();
  const finalSlug = slug || routeSlug;

  useEffect(() => {
    if (isOpen) {
        setIsVisible(true);
        document.body.style.overflow = 'hidden';
        setSearchQuery('');
        setIsSearchOpen(false);
        setSelectedTab('Tất cả');
    } else {
        const timer = setTimeout(() => {
            setIsVisible(false);
            document.body.style.overflow = 'unset';
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const { data: tables } = useQuery({
        queryKey: ['tables', finalSlug],
        queryFn: () => tablesApi.getAll(finalSlug),
        enabled: isOpen,
  });

  const activeTables = tables?.filter(t => 
    t.id !== sourceTable.id && 
    (t.status === 'Đang sử dụng' || t.status === 'Trống' || t.active_order?.status === 'active')
  ) || [];

  const areas = useMemo(() => {
    const list = new Set(activeTables.map((t: Table) => t.location || 'Khác'));
    return ['Tất cả', ...Array.from(list)];
  }, [activeTables]);

  const filteredTables = activeTables.filter(t => {
      const location = t.location || 'Khác';
      const matchesTab = selectedTab === 'Tất cả' || location === selectedTab;
      
      const query = searchQuery.toLowerCase();
      const matchesSearch = t.code.toLowerCase().includes(query) || t.name.toLowerCase().includes(query);
      
      return matchesTab && matchesSearch;
  });

  const mergeMutation = useMutation({
    mutationFn: () => ordersApi.merge(sourceTable.id, selectedTargetId!),
    onSuccess: (data) => {
      console.log('Merge/Move Success Data:', data);
      showNotification(data?.message || 'Gộp / Chuyển bàn thành công');
      
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  const handleMerge = () => {
    if (!selectedTargetId) return;
    mergeMutation.mutate();
  };

  if (!isVisible && !isOpen) return null;

  return createPortal(
    <div 
        className={`fixed inset-0 z-[60] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => e.stopPropagation()}
    >
        {/* Backdrop */}
        <div 
             className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
             onClick={onClose}
        />

        {/* Drawer Panel */}
        <div className={`relative w-full max-w-md h-full bg-white dark:bg-[#1A1D27] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gộp / Chuyển bàn</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">Nguồn: {sourceTable.code}</p>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Filters */}
            <div className="relative px-4 pt-4 pb-0 flex items-center justify-between gap-2 shrink-0 bg-white dark:bg-[#1A1D27] z-10 min-h-[50px]">
                {/* Tabs */}
                <div 
                    className="flex gap-2 overflow-x-auto no-scrollbar flex-1 pb-2 pr-12"
                    onWheel={(e) => {
                        if (e.deltaY !== 0) {
                            e.currentTarget.scrollLeft += e.deltaY;
                        }
                    }}
                >
                    {areas.map((area) => (
                        <button
                            key={area}
                            onClick={() => setSelectedTab(area)}
                            className={`
                                px-4 py-2 whitespace-nowrap rounded-lg transition-all font-medium text-sm
                                ${selectedTab === area 
                                    ? 'bg-[#13ec6d] text-slate-900 font-bold shadow-sm' 
                                    : 'bg-gray-100 dark:bg-[#272a37] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#323645] hover:text-gray-900 dark:hover:text-white'
                                }
                            `}
                        >
                            {area}
                        </button>
                    ))}
                </div>

                {/* Search Toggle */}
                <div className={`transition-all duration-300 ease-in-out absolute right-4 top-4 z-20 flex items-center bg-white dark:bg-[#1A1D27] ${
                    isSearchOpen 
                        ? 'w-[calc(100%-2rem)] h-10' 
                        : 'w-10 h-10 justify-center'
                }`}>
                    {isSearchOpen ? (
                        <div className="relative w-full h-full">
                            <input 
                                ref={inputRef}
                                type="text"
                                placeholder="Tìm kiếm bàn..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onBlur={() => {
                                    // Delay to allow clicking close button if that was the target
                                    setTimeout(() => {
                                        if (!searchQuery) setIsSearchOpen(false);
                                    }, 200);
                                }}
                                autoFocus
                                className="w-full h-full pl-9 pr-9 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-[#13ec6d] placeholder-gray-400 dark:placeholder-gray-500"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    setSearchQuery('');
                                    setIsSearchOpen(false);
                                }}
                                className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setIsSearchOpen(true);
                                // setTimeout is handled by autoFocus or we can force it
                            }}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors
                                ${searchQuery 
                                    ? 'text-[#13ec6d] bg-[#13ec6d]/10' 
                                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#323645] hover:text-gray-600 dark:hover:text-white'
                                }
                            `}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pt-2 custom-scrollbar">
                <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Hướng dẫn:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Chọn bàn đích <b>TRỐNG</b> để <b>Chuyển bàn</b>.</li>
                        <li>Chọn bàn <b>ĐANG SỬ DỤNG</b> để <b>Gộp bàn</b>.</li>
                    </ul>
                </div>

                <div className="space-y-3">
                    {filteredTables.length === 0 ? (
                        <div className="text-center p-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                            <p>Không tìm thấy bàn phù hợp</p>
                        </div>
                    ) : (
                        filteredTables.map((table) => {
                           const hasOrder = !!table.active_order;
                           const isSelected = selectedTargetId === table.id;
                           
                           return (
                              <div
                                key={table.id}
                                onClick={() => setSelectedTargetId(table.id)}
                                className={`
                                  cursor-pointer p-3 rounded-xl border transition-all relative group
                                  ${isSelected
                                    ? 'border-[#13ec6d] bg-green-50 dark:bg-[#13ec6d]/10 ring-1 ring-[#13ec6d]' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-[#13ec6d]/50 dark:hover:border-[#13ec6d]/50 bg-white dark:bg-gray-800 hover:shadow-md'
                                  }
                                `}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${hasOrder ? 'bg-red-500' : 'bg-green-500'}`}>
                                        {table.code.replace('T', '')}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-base ${isSelected ? 'text-[#13ec6d]' : 'text-gray-900 dark:text-white'}`}>
                                            {table.name}
                                        </h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            hasOrder 
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
                                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                        }`}>
                                            {hasOrder ? 'Đang dùng' : 'Trống'}
                                        </span>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                      {table.active_order?.total_before_discount !== undefined && (
                                         <p className="font-bold text-gray-900 dark:text-white">
                                             {formatCurrency(table.active_order.total_before_discount)}
                                         </p>
                                      )}
                                      {isSelected && (
                                          <div className="mt-1 text-[#13ec6d]">
                                              <svg className="w-5 h-5 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                          </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                           );
                        })
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex gap-3 pb-8 lg:pb-4">
                  <button
                    type="button"
                    className="flex-1 justify-center rounded-lg px-4 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 focus:outline-none dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                    onClick={onClose}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className={`flex-1 justify-center rounded-lg px-4 py-2.5 text-sm font-bold text-slate-900 border border-transparent shadow-sm focus:outline-none transition-all ${!selectedTargetId || mergeMutation.isPending ? 'bg-gray-300 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' : 'bg-[#13ec6d] hover:bg-[#10c95d] hover:shadow-lg'}`}
                    onClick={handleMerge}
                    disabled={!selectedTargetId || mergeMutation.isPending}
                  >
                    {mergeMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
            </div>
        </div>
    </div>,
    document.body
  );
}

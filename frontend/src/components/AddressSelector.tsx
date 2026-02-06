import { useState, useEffect } from 'react';
import { apiClient } from '../api/client'; // Use our client
import { SearchableSelect } from './SearchableSelect';

// Use local proxy
const PROVINCE_API = '/public/locations/provinces';

interface Option {
  code: number;
  name: string;
}

interface AddressSelectorProps {
  countryValue: string;
  provinceValue: string;
  wardValue: string;
  onProvinceChange: (name: string) => void;
  onWardChange: (name: string) => void;
  errors?: any;
}

export function AddressSelector({ 
    countryValue, 
    provinceValue, 
    wardValue, 
    onProvinceChange, 
    onWardChange,
    errors 
}: AddressSelectorProps) {
    const [provinces, setProvinces] = useState<Option[]>([]);
    const [wards, setWards] = useState<Option[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    // Fetch Provinces on Mount
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true);
            try {
                // Get simplified list
                const res = await apiClient.get(PROVINCE_API);
                setProvinces(res.data);
            } catch (error) {
                console.error('Error fetching provinces:', error);
            } finally {
                setLoadingProvinces(false);
            }
        };
        fetchProvinces();
    }, []);

    // Fetch Wards when Province Changes
    useEffect(() => {
        if (!provinceValue) {
            setWards([]);
            return;
        }

        const fetchWards = async () => {
            const province = provinces.find(p => p.name === provinceValue);
            if (!province) return;

            setLoadingWards(true);
            try {
                // Fetch depth=3 to get districts and wards
                console.log(`Fetching wards for province ${province.code} with depth=3...`);
                // Proxy route: /public/locations/provinces/{code} (Controller handles aggregation)
                const res = await apiClient.get(`${PROVINCE_API}/${province.code}`);
                
                const districts = res.data.districts || [];
                
                let allWards: Option[] = [];

                if (districts.length > 0) {
                    // Structure: Province -> Districts -> Wards
                    allWards = districts.flatMap((d: any) => 
                        (d.wards || []).map((w: any) => ({
                            ...w,
                            name: `${w.name} - ${d.name}`
                        }))
                    );
                } else if (res.data.wards && res.data.wards.length > 0) {
                     // Structure: Province -> Wards (Flattened V2)
                     allWards = res.data.wards;
                }
                
                setWards(allWards);
            } catch (error) {
                console.error('Error fetching wards:', error);
            } finally {
                setLoadingWards(false);
            }
        };

        fetchWards();
    }, [provinceValue, provinces]);

    return (
        <>
            <div>
                <label className="block text-sm mb-1 text-gray-400">Quốc gia</label>
                <div className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white opacity-80 cursor-not-allowed">
                    {countryValue || 'Việt Nam'}
                </div>
            </div>

            <div>
                <label className="block text-sm mb-1 text-gray-400">Tỉnh/Thành phố</label>
                <SearchableSelect
                    options={provinces}
                    value={provinceValue}
                    onChange={(opt) => {
                        onProvinceChange(opt.name);
                        onWardChange(''); // Reset ward on province change
                    }}
                    placeholder="Chọn Tỉnh/Thành phố"
                    disabled={loadingProvinces}
                />
                {errors.province && <p className="text-red-400 text-xs mt-1">{errors.province.message}</p>}
            </div>


            <div>
                <label className="block text-sm mb-1 text-gray-400">Phường/Xã</label>
                <SearchableSelect
                    options={wards}
                    value={wardValue}
                    onChange={(opt) => onWardChange(opt.name)}
                    placeholder={loadingWards ? "Đang tải..." : "Chọn Phường/Xã"}
                    disabled={!provinceValue || loadingWards}
                />
                {errors.ward && <p className="text-red-400 text-xs mt-1">{errors.ward.message}</p>}
            </div>
        </>
    );
}

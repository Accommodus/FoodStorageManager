import { useState } from 'react';
import type {
    ItemDraft,
    CreateItemRequest,
    CreateItemResponse,
    CreateItemSuccess,
    CreateItemFailure,
} from '@foodstoragemanager/schema';
import { buildApiUrl } from '../../lib/api';

const ITEMS_ENDPOINT = buildApiUrl('/items');

const isCreateItemSuccess = (
    payload: CreateItemResponse
): payload is CreateItemSuccess => 'data' in payload && 'item' in payload.data;

const isCreateItemFailure = (
    payload: CreateItemResponse
): payload is CreateItemFailure => 'error' in payload;

interface CreateItemFormProps {
    onItemCreated?: () => void;
    onCancel?: () => void;
}

export const CreateItemForm = ({ onItemCreated, onCancel }: CreateItemFormProps) => {
    const [formData, setFormData] = useState<ItemDraft>({
        name: '',
        locationId: '',
        upc: '',
        category: '',
        tags: [],
        unit: 'ea',
        caseSize: undefined,
        expiresAt: undefined,
        shelfLifeDays: undefined,
        allergens: [],
        isActive: true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Store raw string values for tags and allergens to allow typing commas
    const [tagsInput, setTagsInput] = useState('');
    const [allergensInput, setAllergensInput] = useState('');


    const handleInputChange = (field: keyof ItemDraft, value: string | number | boolean | string[]) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleTagsChange = (value: string) => {
        setTagsInput(value);
        // Only process when user finishes typing (on blur) or submits
    };

    const handleAllergensChange = (value: string) => {
        setAllergensInput(value);
        // Only process when user finishes typing (on blur) or submits
    };

    const processTagsAndAllergens = () => {
        const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        const allergens = allergensInput.split(',').map(allergen => allergen.trim()).filter(allergen => allergen.length > 0);
        
        setFormData(prev => ({
            ...prev,
            tags,
            allergens
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Process tags and allergens before submitting
        processTagsAndAllergens();
        
        if (!formData.name.trim() || !formData.locationId) {
            setError('Name and location are required');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const requestBody: CreateItemRequest = {
                body: {
                    item: {
                        ...formData,
                        name: formData.name.trim(),
                        upc: formData.upc?.trim() || undefined,
                        category: formData.category?.trim() || undefined,
                    },
                },
            };

            const response = await fetch(ITEMS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const payload = (await response.json()) as CreateItemResponse;

            if (!response.ok || isCreateItemFailure(payload)) {
                const message = isCreateItemFailure(payload)
                    ? payload.error.message
                    : `Failed to create item (status ${response.status})`;
                const issues = isCreateItemFailure(payload) && payload.error.issues
                    ? ` Details: ${JSON.stringify(payload.error.issues)}`
                    : '';
                throw new Error(`${message}${issues}`);
            }

            if (isCreateItemSuccess(payload)) {
                setSuccess('Item created successfully!');
                setFormData({
                    name: '',
                    locationId: '',
                    upc: '',
                    category: '',
                    tags: [],
                    unit: 'ea',
                    caseSize: undefined,
                    expiresAt: undefined,
                    shelfLifeDays: undefined,
                    allergens: [],
                    isActive: true,
                });
                
                // Call the callback after a short delay to show success message
                setTimeout(() => {
                    onItemCreated?.();
                }, 1500);
            }
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : 'Failed to create item';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Item</h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name - Required */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Location - Required */}
                <div>
                    <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1">
                        Location *
                    </label>
                    <input
                        type="text"
                        id="locationId"
                        value={formData.locationId}
                        onChange={(e) => handleInputChange('locationId', e.target.value)}
                        placeholder="e.g., Freezer, Pantry, Fridge"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the location name where this item is stored</p>
                </div>

                {/* UPC */}
                <div>
                    <label htmlFor="upc" className="block text-sm font-medium text-gray-700 mb-1">
                        UPC/Barcode
                    </label>
                    <input
                        type="text"
                        id="upc"
                        value={formData.upc || ''}
                        onChange={(e) => handleInputChange('upc', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Category */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                    </label>
                    <input
                        type="text"
                        id="category"
                        value={formData.category || ''}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        placeholder="e.g., Produce, Grains, Dairy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Unit */}
                <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                    </label>
                    <select
                        id="unit"
                        value={formData.unit || 'ea'}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ea">Each</option>
                        <option value="lb">Pound</option>
                        <option value="kg">Kilogram</option>
                        <option value="case">Case</option>
                        <option value="box">Box</option>
                        <option value="bag">Bag</option>
                    </select>
                </div>

                {/* Case Size */}
                <div>
                    <label htmlFor="caseSize" className="block text-sm font-medium text-gray-700 mb-1">
                        Case Size
                    </label>
                    <input
                        type="number"
                        id="caseSize"
                        value={formData.caseSize || ''}
                        onChange={(e) => handleInputChange('caseSize', e.target.value ? parseInt(e.target.value) : 0)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Shelf Life Days */}
                <div>
                    <label htmlFor="shelfLifeDays" className="block text-sm font-medium text-gray-700 mb-1">
                        Shelf Life (Days)
                    </label>
                    <input
                        type="number"
                        id="shelfLifeDays"
                        value={formData.shelfLifeDays || ''}
                        onChange={(e) => handleInputChange('shelfLifeDays', e.target.value ? parseInt(e.target.value) : 0)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Expires At */}
                <div>
                    <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration Date
                    </label>
                    <input
                        type="date"
                        id="expiresAt"
                        value={formData.expiresAt ? formData.expiresAt.split('T')[0] : ''}
                        onChange={(e) => handleInputChange('expiresAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Tags */}
                <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                    </label>
                    <input
                        type="text"
                        id="tags"
                        value={tagsInput}
                        onChange={(e) => handleTagsChange(e.target.value)}
                        onBlur={processTagsAndAllergens}
                        placeholder="e.g., gluten-free, organic, shelf-stable"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
                </div>

                {/* Allergens */}
                <div>
                    <label htmlFor="allergens" className="block text-sm font-medium text-gray-700 mb-1">
                        Allergens
                    </label>
                    <input
                        type="text"
                        id="allergens"
                        value={allergensInput}
                        onChange={(e) => handleAllergensChange(e.target.value)}
                        onBlur={processTagsAndAllergens}
                        placeholder="e.g., nuts, dairy, gluten"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple allergens with commas</p>
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive ?? true}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                        Item is active
                    </label>
                </div>

                {/* Form Actions */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Item'}
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

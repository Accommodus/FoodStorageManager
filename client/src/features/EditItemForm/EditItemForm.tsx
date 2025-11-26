import { useState, useEffect } from 'react';
import type { ItemDraft, ItemResource } from '@foodstoragemanager/schema';
import { getSchemaClient } from '@lib/schemaClient';

interface EditItemFormProps {
    item: ItemResource;
    onItemUpdated?: () => void;
    onCancel?: () => void;
}

/// Function definitions provided by Copilot and logic  was filled in by Luis Goicoechea

export const EditItemForm = ({ item, onItemUpdated, onCancel }: EditItemFormProps) => {
    const [formData, setFormData] = useState<ItemDraft>({
        name: item.name || '',
        locationId: item.locationId || '',
        upc: item.upc || '',
        category: item.category || '',
        tags: item.tags || [],
        unit: item.unit || 'ea',
        caseSize: item.caseSize,
        expiresAt: item.expiresAt,
        shelfLifeDays: item.shelfLifeDays,
        allergens: item.allergens || [],
        isActive: item.isActive ?? true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [tagsInput, setTagsInput] = useState(
        item.tags && item.tags.length > 0 ? item.tags.join(', ') : ''
    );
    const [allergensInput, setAllergensInput] = useState(
        item.allergens && item.allergens.length > 0 ? item.allergens.join(', ') : ''
    );

    useEffect(() => {
        setFormData({
            name: item.name || '',
            locationId: item.locationId || '',
            upc: item.upc || '',
            category: item.category || '',
            tags: item.tags || [],
            unit: item.unit || 'ea',
            caseSize: item.caseSize,
            expiresAt: item.expiresAt,
            shelfLifeDays: item.shelfLifeDays,
            allergens: item.allergens || [],
            isActive: item.isActive ?? true,
        });
        setTagsInput(item.tags && item.tags.length > 0 ? item.tags.join(', ') : '');
        setAllergensInput(item.allergens && item.allergens.length > 0 ? item.allergens.join(', ') : '');
    }, [item]);

    const handleInputChange = (
        field: keyof ItemDraft,
        value: string | number | boolean | string[] | undefined
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        const allergens = allergensInput.split(',').map(allergen => allergen.trim()).filter(allergen => allergen.length > 0);

        const preparedDraft: ItemDraft = {
            ...formData,
            locationId: item.locationId,
            tags,
            allergens,
            name: formData.name.trim(),
            upc: formData.upc?.trim() || undefined,
            category: formData.category?.trim() || undefined,
        };

        if (!preparedDraft.name) {
            setError('Name is required');
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            setSuccess(null);

            const client = getSchemaClient();
            const payload = await client.updateItem(item._id, preparedDraft);

            if ('error' in payload) {
                const issues = payload.error.issues ? ` Details: ${JSON.stringify(payload.error.issues)}` : '';
                throw new Error(`${payload.error.message}${issues}`);
            }

            // Close immediately and refresh - don't wait for success message
            onItemUpdated?.();
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : 'Failed to update item';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Item</h2>
            
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
                <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                    </label>
                    <input
                        type="text"
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="edit-upc" className="block text-sm font-medium text-gray-700 mb-1">
                        UPC/Barcode
                    </label>
                    <input
                        type="text"
                        id="edit-upc"
                        value={formData.upc || ''}
                        onChange={(e) => handleInputChange('upc', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                    </label>
                    <input
                        type="text"
                        id="edit-category"
                        value={formData.category || ''}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        placeholder="e.g., Produce, Grains, Dairy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="edit-unit" className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                    </label>
                    <select
                        id="edit-unit"
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

                <div>
                    <label htmlFor="edit-caseSize" className="block text-sm font-medium text-gray-700 mb-1">
                        Case Size
                    </label>
                    <input
                        type="number"
                        id="edit-caseSize"
                        value={formData.caseSize || ''}
                        onChange={(e) => handleInputChange('caseSize', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="edit-shelfLifeDays" className="block text-sm font-medium text-gray-700 mb-1">
                        Shelf Life (Days)
                    </label>
                    <input
                        type="number"
                        id="edit-shelfLifeDays"
                        value={formData.shelfLifeDays || ''}
                        onChange={(e) => handleInputChange('shelfLifeDays', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="edit-expiresAt" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiration Date
                    </label>
                    <input
                        type="date"
                        id="edit-expiresAt"
                        value={formData.expiresAt ? formData.expiresAt.split('T')[0] : ''}
                        onChange={(e) => handleInputChange('expiresAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                    </label>
                    <input
                        type="text"
                        id="edit-tags"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="e.g., gluten-free, organic, shelf-stable"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
                </div>

                <div>
                    <label htmlFor="edit-allergens" className="block text-sm font-medium text-gray-700 mb-1">
                        Allergens
                    </label>
                    <input
                        type="text"
                        id="edit-allergens"
                        value={allergensInput}
                        onChange={(e) => setAllergensInput(e.target.value)}
                        placeholder="e.g., nuts, dairy, gluten"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple allergens with commas</p>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="edit-isActive"
                        checked={formData.isActive ?? true}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-isActive" className="ml-2 text-sm text-gray-700">
                        Item is active
                    </label>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Updating...' : 'Update Item'}
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


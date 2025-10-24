import { useState } from 'react';
import { InventoryList } from '@features/InventoryList';
import { SearchBar } from '@features/ui/SearchBar';
import { CreateItemForm } from '@features/CreateItemForm';

const Inventory = () => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleItemCreated = () => {
        setShowCreateForm(false);
        setRefreshKey(prev => prev + 1); // Force refresh of inventory list
    };

    return (
        <div className="p-10">
            <div className="flex justify-between items-center mb-16">
                <h1 className="bg-green text-5xl font-bold tracking-wide">
                    Inventory
                </h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                    {showCreateForm ? 'Hide Form' : 'Add New Item'}
                </button>
            </div>
            
            {showCreateForm && (
                <div className="mb-8">
                    <CreateItemForm 
                        onItemCreated={handleItemCreated}
                        onCancel={() => setShowCreateForm(false)}
                    />
                </div>
            )}
            
            <SearchBar />
            <InventoryList key={refreshKey} />
        </div>
    );
};

export default Inventory;

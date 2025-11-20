import { useState, useEffect } from 'react';
import type { ItemResource, LocationResource, ListLocationsResponse } from '@foodstoragemanager/schema';
import { getSchemaClient } from '@lib/schemaClient';

interface ChangeLocationModalProps {
    item: ItemResource;
    onLocationChanged?: () => void;
    onCancel?: () => void;
}

export const ChangeLocationModal = ({ item, onLocationChanged, onCancel }: ChangeLocationModalProps) => {
    const [locations, setLocations] = useState<LocationResource[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<string>(item.locationId);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadLocations = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const client = getSchemaClient();
                const payload: ListLocationsResponse = await client.listLocations();

                if ('error' in payload) {
                    const issues =
                        payload.error.issues !== undefined
                            ? ` Details: ${JSON.stringify(payload.error.issues)}`
                            : '';
                    throw new Error(`${payload.error.message}${issues}`);
                }

                setLocations(payload.locations ?? []);
            } catch (caughtError) {
                const message =
                    caughtError instanceof Error
                        ? caughtError.message
                        : 'Unable to fetch locations.';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        void loadLocations();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedLocationId === item.locationId) {
            onCancel?.();
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const client = getSchemaClient();
            const payload = await client.updateItem(item._id, {
                locationId: selectedLocationId,
            });

            if ('error' in payload) {
                const issues = payload.error.issues ? ` Details: ${JSON.stringify(payload.error.issues)}` : '';
                throw new Error(`${payload.error.message}${issues}`);
            }

            onLocationChanged?.();
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : 'Failed to update location';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedLocation = locations.find(loc => loc._id === selectedLocationId);
    const currentLocation = locations.find(loc => loc._id === item.locationId);

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Change Location</h2>
            <p className="text-sm text-gray-600 mb-4">
                Move <strong>{item.name}</strong> to a different location
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">Loading locations...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {currentLocation && (
                        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                            <p className="text-sm text-gray-600">Current Location:</p>
                            <p className="font-medium text-gray-800">{currentLocation.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{currentLocation.type}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="location-select" className="block text-sm font-medium text-gray-700 mb-2">
                            Select New Location *
                        </label>
                        <select
                            id="location-select"
                            value={selectedLocationId}
                            onChange={(e) => setSelectedLocationId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={isSubmitting}
                        >
                            {locations.map((location) => (
                                <option key={location._id} value={location._id}>
                                    {location.name} ({location.type})
                                </option>
                            ))}
                        </select>
                        {selectedLocation && selectedLocation._id !== item.locationId && selectedLocation.address && (
                            <p className="mt-2 text-sm text-gray-600">
                                Address: {selectedLocation.address.line1}, {selectedLocation.address.city}, {selectedLocation.address.state} {selectedLocation.address.zip}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || selectedLocationId === item.locationId}
                            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Updating...' : 'Update Location'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};


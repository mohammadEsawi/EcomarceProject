import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Footer from "../components/Footer";
import { ShopContext } from "../context/ShopContextProvider";
import { addAddress, getProfile, saveProfile } from "../api/client";

const emptyAddress = {
  line1: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
};

export default function Profile() {
  const { token, user, navigate } = useContext(ShopContext);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    addresses: [],
    recentActivity: [],
  });
  const [address, setAddress] = useState(emptyAddress);

  useEffect(() => {
    async function load() {
      if (!token) {
        toast.error("Please login to access your profile");
        navigate("/login");
        return;
      }

      try {
        const data = await getProfile(token);
        setProfile(data);
      } catch (error) {
        toast.error(error.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, navigate]);

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      const updated = await saveProfile(profile, token);
      setProfile(updated);
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error.message || "Failed to save profile");
    }
  };

  const handleAddAddress = async (event) => {
    event.preventDefault();
    try {
      const updated = await addAddress(address, token);
      setProfile(updated);
      setAddress(emptyAddress);
      toast.success("Address saved");
    } catch (error) {
      toast.error(error.message || "Failed to save address");
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 mt-10 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">
          Update your details and manage addresses
        </p>
      </header>

      {loading ? (
        <p className="text-gray-500">Loading profile...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-xl shadow-sm p-6 space-y-4"
          >
            <h2 className="text-xl font-semibold">Account Details</h2>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Name"
              value={profile.name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Email"
              value={profile.email}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, email: e.target.value }))
              }
            />
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Phone"
              value={profile.phone}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
            <button className="px-4 py-2 rounded-lg bg-black text-white">
              Save profile
            </button>
          </form>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold">Add Address</h2>
            <form onSubmit={handleAddAddress} className="space-y-3">
              <input
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Address line"
                value={address.line1}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, line1: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="City"
                  value={address.city}
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, city: e.target.value }))
                  }
                />
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="State"
                  value={address.state}
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, state: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Country"
                  value={address.country}
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, country: e.target.value }))
                  }
                />
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="ZIP"
                  value={address.zipCode}
                  onChange={(e) =>
                    setAddress((prev) => ({ ...prev, zipCode: e.target.value }))
                  }
                />
              </div>
              <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">
                Save address
              </button>
            </form>
          </div>
        </div>
      )}

      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Saved Addresses</h2>
        {profile.addresses?.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {profile.addresses.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 text-sm text-gray-700"
              >
                <p>{item.line1}</p>
                <p>
                  {item.city}, {item.state}
                </p>
                <p>
                  {item.country} {item.zipCode}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No saved addresses yet.</p>
        )}
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {profile.recentActivity?.length ? (
          <ul className="space-y-2 text-sm text-gray-700">
            {profile.recentActivity.map((entry, index) => (
              <li key={index} className="border-b pb-2 last:border-0">
                {entry}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent activity yet.</p>
        )}
      </section>

      <Footer />
    </main>
  );
}

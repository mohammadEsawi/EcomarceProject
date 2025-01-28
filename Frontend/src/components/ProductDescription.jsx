import { Tab } from '@headlessui/react';
import { FiInfo, FiDroplet, FiSun, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';

const CareInstruction = ({ icon: Icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -3 }}
    className="flex items-start gap-4 p-4 bg-white rounded-lg transition-all hover:bg-secondary hover:text-white"
  >
    <div className="p-2 bg-white rounded-lg shadow-sm text-black hover:bg-white">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h4 className="font-semibold text-gray-900 hover:text-white">{title}</h4>
      <p className="mt-1 text-sm text-gray-600 hover:text-white">{description}</p>
    </div>
  </motion.div>
);

export default function ProductDescription() {
  return (
    <section className="bg-white rounded-xl shadow-lg p-8 lg:p-12">
      <Tab.Group>
        <Tab.List className="flex gap-8 border-b border-gray-100 pb-4">
          {['Product Details', 'Care Instructions'].map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                `relative px-1 pb-3 text-lg font-medium focus:outline-none transition-colors ${
                  selected ? 'text-gray-900' : 'text-black hover:text-gray-700'
                }`
              }
            >
              {({ selected }) => (
                <>
                  {tab}
                  {selected && (
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"
                      layoutId="tabUnderline"
                    />
                  )}
                </>
              )}
            </Tab>
          ))}
        </Tab.List>
        
        <Tab.Panels className="mt-6">
          <Tab.Panel>
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white text-primary">
                    <FiInfo className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Craftsmanship</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Meticulously crafted from premium cotton jersey fabric, this piece features:
                </p>
                <ul className="grid gap-3 pl-5">
                  {[
                    'Reinforced triple-stitched seams',
                    'Double-layered collar construction',
                    'Tagless necklabel for comfort',
                    'Pre-shrunk fabric treatment'
                  ].map((item, idx) => (
                    <li 
                      key={idx}
                      className="relative before:absolute before:-left-5 before:top-2 before:w-1.5 before:h-1.5 before:bg-secondary before:rounded-full"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white text-primary">
                    <FiShield className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Materials & Certifications</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: '100% Organic Cotton', cert: 'GOTS Certified' },
                    { label: 'Eco-Friendly Dyes', cert: 'OEKO-TEX Standard 100' },
                    { label: 'Recycled Polyester Thread', cert: 'GRS Certified' },
                    { label: 'Low-Impact Production', cert: 'ISO 14001 Certified' }
                  ].map((material, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-lg hover:bg-secondary hover:text-white transition-all">
                      <p className="font-medium text-gray-900 hover:text-white">{material.label}</p>
                      <p className="mt-1 text-sm text-gray-500 hover:text-white">{material.cert}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="space-y-8">
              <CareInstruction
                icon={FiDroplet}
                title="Washing Guidelines"
                description="Machine wash cold (30°C max) with similar colors. Gentle cycle recommended."
              />
              
              <CareInstruction
                icon={FiSun}
                title="Drying Instructions"
                description="Line dry in shade. Avoid direct sunlight to prevent color fading."
              />

              <div className="p-6 bg-white rounded-lg hover:bg-secondary hover:text-white transition-all">
                <h4 className="font-semibold text-gray-900 hover:text-white">Pro Tips</h4>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>• Iron inside-out on medium heat</li>
                  <li>• Avoid bleach and fabric softeners</li>
                  <li>• Wash before first use for optimal softness</li>
                </ul>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </section>
  );
}
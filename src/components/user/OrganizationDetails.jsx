import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, apiService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, CalendarCheck, Clock, CheckCircle2, ChevronRight, User, Timer,
    Building2, MapPin, Globe, Facebook, Instagram, Linkedin, ShieldAlert,
    ExternalLink, Mail, Phone, Info, ShieldCheck, X, Maximize2, Star, ArrowRight
} from 'lucide-react';
import BookingWizard from './BookingWizard';
import ReviewModal from './ReviewModal';

export default function OrganizationDetails() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [org, setOrg] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [reviewsData, setReviewsData] = useState(null);
    const [pastAppointments, setPastAppointments] = useState([]);
    const [reviewModalAppt, setReviewModalAppt] = useState(null);



    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // 1. Fetch Org
                const orgRes = await api.get(`/organizations/slug/${slug}`);
                setOrg(orgRes.data);

                // 2. Fetch Services
                const servicesRes = await api.get(`/organizations/${orgRes.data.id}/services`);
                setServices(servicesRes.data);

                // 3. Fetch Reviews
                const reviewsRes = await apiService.getOrgReviews(orgRes.data.id);
                setReviewsData(reviewsRes.data);

            } catch (err) {
                console.error('Failed to load org details or reviews', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchUserPastAppointments = async () => {
            if (!org) return; // Wait until org is loaded
            try {
                const myApptsRes = await api.get('/appointments/my');
                const completedForOrg = myApptsRes.data.filter(
                    appt => appt.org_id === org.id && appt.status === 'completed'
                );
                setPastAppointments(completedForOrg);
            } catch (e) {
                console.log('User might not be logged in or no appointments', e);
            }
        };

        fetchDetails();
    }, [slug]);

    useEffect(() => {
        if (org) {
            const fetchUserPastAppointments = async () => {
                try {
                    const myApptsRes = await api.get('/appointments/my');
                    const completedForOrg = myApptsRes.data.filter(
                        appt => appt.org_id === org.id && appt.status === 'completed'
                    );
                    setPastAppointments(completedForOrg);
                } catch (e) {
                    console.log('User might not be logged in or no appointments', e);
                }
            };
            fetchUserPastAppointments();
        }
    }, [org]);

    if (loading) return <div className="p-12 text-center">Loading...</div>;
    if (!org) return <div className="p-12 text-center">Organization not found</div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Cover Area */}
            <div className="relative">
                <button
                    onClick={() => navigate('/organizations')}
                    className="absolute -top-10 left-0 flex items-center text-gray-500 hover:text-gray-900 text-sm font-medium transition py-2"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Search
                </button>

                {/* Cover Image */}
                <div className="h-48 md:h-64 rounded-3xl overflow-hidden bg-indigo-50 border border-gray-100 relative group">
                    {org?.images?.find(img => img.image_type === 'cover') ? (
                        <img
                            src={org.images.find(img => img.image_type === 'cover').image_url}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                            <Building2 className="h-20 w-20 text-indigo-300" />
                        </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent"></div>

                    {/* Trust Badge overlay */}
                    {org?.trustScore !== undefined && (
                        <div className={`absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border shadow-lg ${org.trustScore >= 80 ? 'bg-emerald-500/90 border-emerald-400 text-white' :
                            org.trustScore >= 50 ? 'bg-amber-500/90 border-amber-400 text-white' :
                                'bg-red-500/90 border-red-400 text-white'
                            }`}>
                            {org.trustScore >= 80 ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                            <span className="text-xs font-bold uppercase tracking-wider">{org.trustScore}% Verified</span>
                        </div>
                    )}
                </div>

                {/* Profile Stats / Quick Info */}
                <div className="px-8 -mt-12 relative z-10 flex flex-col md:flex-row items-end justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-end gap-6 w-full">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl p-1.5 shadow-xl border border-gray-100 flex-shrink-0">
                            <div className="w-full h-full bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl overflow-hidden">
                                {org?.images?.find(img => img.image_type === 'logo') ? (
                                    <img
                                        src={org.images.find(img => img.image_type === 'logo').image_url}
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    org.name[0]
                                )}
                            </div>
                        </div>
                        <div className="flex-1 pb-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-black text-gray-900">{org.name}</h1>
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-200">
                                    {org.type || 'Clinic'}
                                </span>
                                {reviewsData && reviewsData.stats.totalReviews > 0 && (
                                    <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200 ml-2">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                                        <span className="font-bold text-sm">{reviewsData.stats.averageRating}</span>
                                        <span className="text-xs text-yellow-600 font-medium">({reviewsData.stats.totalReviews} Reviews)</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 font-medium">
                                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-indigo-400" /> {org?.city || org.address || 'Location Hidden'}</span>
                                {org?.contact_phone && <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-indigo-400" /> {org.contact_phone}</span>}
                                <span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-indigo-400" /> {org.contact_email}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Low Trust Warning */}
            {org && org.trustScore < 40 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-4 items-start shadow-sm"
                >
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="text-amber-800 font-bold">Incomplete Profile</h4>
                        <p className="text-amber-700 text-sm mt-0.5">This organization hasn't fully verified their details. Exercise caution before making significant bookings.</p>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Services & About */}
                <div className="lg:col-span-2 space-y-8">
                    {/* About Content */}
                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Info className="h-5 w-5 text-indigo-600" /> About
                        </h2>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {org?.description || org.description || 'Welcome to our booking page. We are committed to providing exceptional service and care to all our clients. Select a service below to get started.'}
                        </p>

                        {(org?.established_year || org?.total_staff) && (
                            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50">
                                {org.established_year && (
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Established</p>
                                        <p className="font-semibold text-gray-900">{org.established_year}</p>
                                    </div>
                                )}
                                {org.total_staff && (
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Team Size</p>
                                        <p className="font-semibold text-gray-900">{org.total_staff} Specialists</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Gallery - if exists */}
                    {org?.images?.filter(i => i.image_type === 'gallery').length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Photos</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {org.images.filter(i => i.image_type === 'gallery').map((img, idx) => (
                                    <motion.div
                                        key={img.id}
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        onClick={() => setSelectedImage(img.image_url)}
                                        className="relative group rounded-2xl overflow-hidden aspect-square shadow-sm border border-gray-100 cursor-pointer bg-gray-50 flex items-center justify-center p-4 transition-all hover:shadow-xl"
                                    >
                                        <img src={img.image_url} alt="Gallery" className="w-full h-full object-contain" />

                                        {/* Professional Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white transform scale-90 group-hover:scale-100 transition-transform">
                                                <Maximize2 className="h-6 w-6" />
                                            </div>
                                            <span className="text-white text-xs font-bold uppercase tracking-wider">Enlarge</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Image Lightbox Modal */}
                    <AnimatePresence>
                        {selectedImage && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedImage(null)}
                                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
                            >
                                <motion.button
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50 feedback-ring"
                                >
                                    <X className="h-6 w-6" />
                                </motion.button>

                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="relative max-w-full max-h-full flex items-center justify-center"
                                >
                                    <img
                                        src={selectedImage}
                                        alt="Full View"
                                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Services List (Prominent) */}
                    <div className="bg-white p-8 rounded-3xl border-2 border-indigo-50 shadow-sm relative overflow-hidden">
                        {/* Decorative Background for Services Section */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20"></div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-3">
                                <CalendarCheck className="h-6 w-6 text-indigo-600" /> Book an Appointment
                            </h2>
                            <p className="text-gray-500 mb-8 sm:text-lg">Select a service below to choose your preferred time.</p>

                            <div className="grid grid-cols-1 gap-4">
                                {services.map((service, idx) => (
                                    <motion.button
                                        key={service.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => setSelectedService(service)}
                                        className="text-left bg-white p-5 sm:p-6 rounded-2xl border-2 border-gray-100 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-900/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between group gap-4"
                                    >
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{service.name}</h3>
                                            <p className="text-gray-500 text-sm mt-1.5 mb-4 line-clamp-2">{service.description}</p>
                                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600">
                                                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg"><Clock className="h-4 w-4 text-indigo-500" /> Est. {service.duration || 30} mins</span>
                                                <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-100"><Timer className="h-4 w-4" /> Instant Confirmation</span>
                                            </div>
                                        </div>
                                        <div className="sm:shrink-0 w-full sm:w-auto">
                                            <div className="bg-gray-900 text-white w-full sm:w-auto px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:bg-indigo-600 transition-colors shadow-md">
                                                Book Now <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                            {services.length === 0 && !loading && (
                                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mt-4">
                                    <CalendarCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-900 font-bold text-lg mb-1">No services available</p>
                                    <p className="text-gray-500 text-sm max-w-sm mx-auto">This organization hasn't listed any services for booking yet. Check back later.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reviews List */}
                    {reviewsData && reviewsData.reviews.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> Patient Reviews
                            </h2>
                            <div className="space-y-4">
                                {reviewsData.reviews.map((review) => (
                                    <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="font-bold text-gray-900">{review.user_name}</div>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span className="font-bold text-sm text-gray-700">{review.rating}/5</span>
                                            </div>
                                        </div>
                                        {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                                        <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past Appointments to Review */}
                    {pastAppointments.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Your Recent Visits Here
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {pastAppointments.slice(0, 2).map((appt) => (
                                    <div key={appt.id} className="bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900 truncate pr-4">{appt.service_name}</h3>
                                                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md shrink-0">
                                                    {new Date(appt.start_time).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-100">
                                            {!appt.review_id ? (
                                                <button
                                                    onClick={() => setReviewModalAppt(appt)}
                                                    className="w-full flex justify-center items-center gap-2 bg-yellow-50 text-yellow-700 py-2 rounded-xl text-sm font-bold hover:bg-yellow-100 transition border border-yellow-200"
                                                >
                                                    <Star className="h-4 w-4" /> Rate Experience
                                                </button>
                                            ) : (
                                                <div className="w-full flex justify-center items-center gap-2 bg-gray-50 text-gray-600 py-2 rounded-xl text-sm font-bold border border-gray-100">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" /> {appt.review_rating}/5 Rating Given
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Booking Wizard Modal */}
                    {selectedService && (
                        <BookingWizard
                            orgId={org.id}
                            service={selectedService}
                            onClose={() => setSelectedService(null)}
                        />
                    )}

                    {/* Review Modal */}
                    {reviewModalAppt && (
                        <ReviewModal
                            appointment={reviewModalAppt}
                            onClose={() => setReviewModalAppt(null)}
                            onSuccess={() => {
                                setReviewModalAppt(null);
                                // A quick refresh by replacing the state instead of full data reload for instant feedback
                                setPastAppointments(prev => prev.map(a =>
                                    a.id === reviewModalAppt.id ? { ...a, review_id: 'new', review_rating: 5 } : a
                                ));
                                window.location.reload(); // Quick explicit reload for now to fetch real stats
                            }}
                        />
                    )}
                </div>

                {/* Right Side: Contact & Social */}
                <div className="space-y-6">
                    <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Contact & Social</h3>

                        <div className="space-y-4">
                            {org?.website_url && (
                                <a
                                    href={org.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100 group"
                                >
                                    <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-indigo-100 transition-all">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Website</p>
                                        <p className="text-sm font-medium truncate">Visit Website</p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            )}

                            {org?.facebook_url && (
                                <a href={org.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/50 text-blue-700 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 group">
                                    <div className="p-2 bg-white rounded-xl shadow-sm transition-all"><Facebook className="h-4 w-4" /></div>
                                    <span className="text-sm font-bold">Facebook</span>
                                </a>
                            )}

                            {org?.instagram_url && (
                                <a href={org.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-2xl bg-pink-50/50 text-pink-700 hover:bg-pink-50 transition-all border border-transparent hover:border-pink-100 group">
                                    <div className="p-2 bg-white rounded-xl shadow-sm transition-all"><Instagram className="h-4 w-4" /></div>
                                    <span className="text-sm font-bold">Instagram</span>
                                </a>
                            )}

                            {org?.linkedin_url && (
                                <a href={org.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all border border-transparent hover:border-indigo-200 group">
                                    <div className="p-2 bg-white rounded-xl shadow-sm transition-all"><Linkedin className="h-4 w-4" /></div>
                                    <span className="text-sm font-bold">LinkedIn</span>
                                </a>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Location</p>
                                    <p className="text-sm text-gray-700 font-medium leading-tight">{org?.address || org.address || 'Address not listed'}</p>
                                </div>
                            </div>
                            {org?.contact_phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Phone</p>
                                        <p className="text-sm text-gray-700 font-medium">{org.contact_phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Legal & Verification Info */}
                        {(org?.gst_number || org?.registration_number) && (
                            <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col gap-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> Legal & Verification
                                </h4>
                                {org.gst_number && (
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">GST Number</p>
                                        <p className="text-sm text-gray-700 font-mono uppercase font-semibold tracking-tight">{org.gst_number}</p>
                                    </div>
                                )}
                                {org.registration_number && (
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Registration No.</p>
                                        <p className="text-sm text-gray-700 font-medium">{org.registration_number}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

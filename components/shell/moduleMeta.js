"use client"
import {useEffect, useState} from 'react';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {DEFAULT_MODULE_ACCENT, MODULE_ACCENTS} from "@/components/theme/tokens";

const ICONS = {
    risk: SecurityOutlinedIcon,
    loqlar: HistoryOutlinedIcon,
    logs: HistoryOutlinedIcon,
    'inzibatci-paneli': AdminPanelSettingsOutlinedIcon,
    inventar: Inventory2OutlinedIcon,
    icazeler: EventAvailableOutlinedIcon,
    emeliyyatlar: FactCheckOutlinedIcon,
    elanlar: CampaignOutlinedIcon,
    telimler: SchoolOutlinedIcon,
};

export function moduleIcon(urlEndpoint) {
    return ICONS[urlEndpoint] || WidgetsOutlinedIcon;
}

export function moduleAccent(urlEndpoint) {
    return MODULE_ACCENTS[urlEndpoint] || DEFAULT_MODULE_ACCENT;
}

/** Cari URL-in birinci seqmenti (modulun url_endpoint-i). */
export function moduleKeyFromPath(pathname) {
    return (pathname || '/').split('/').filter(Boolean)[0] || '';
}

/*
 * İstifadəçinin modulları. Yan menyu, ana səhifə və modul səhifələri eyni
 * siyahını istifadə edir - sorğu bir dəfə göndərilir və nəticə yaddaşda saxlanılır.
 */
let cache = null;
let inflight = null;
const listeners = new Set();

async function load() {
    if (inflight) return inflight;
    inflight = service_api.get(NEXT_API_ENDPOINTS.CORE.MODULES)
        .then((res) => {
            cache = (res.data || []).filter((m) => !!m.url_endpoint);
            listeners.forEach((fn) => fn(cache));
            return cache;
        })
        .catch(() => {
            cache = cache || [];
            listeners.forEach((fn) => fn(cache));
            return cache;
        })
        .finally(() => { inflight = null; });
    return inflight;
}

export function useUserModules() {
    const [modules, setModules] = useState(cache);
    useEffect(() => {
        listeners.add(setModules);
        if (!cache) load();
        return () => listeners.delete(setModules);
    }, []);
    return {modules: modules || [], loading: modules === null};
}

export function refreshUserModules() {
    cache = null;
    return load();
}

"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {C} from "@/components/theme/tokens";


const cardSx = {
    backgroundColor: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: '10px',
    p: {xs: 2, sm: 3},
};

/* ---------------------------------------------------------------------- */
/* Modulun / alt-modulun bir qurum üçün açıq olub-olmadığını göstərən     */
/* matrix - yalnız superuser görür.                                       */
/* ---------------------------------------------------------------------- */
function OrgAccessMatrix() {
    const {enqueueSnackbar} = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null); // {organizations, modules}
    const [savingKey, setSavingKey] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.CORE.MODULE_ORG_ACCESS);
            setData(res.data);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { load(); }, [load]);

    async function toggle(target, id, organizationId, grant) {
        const key = `${target}:${id}:${organizationId}`;
        setSavingKey(key);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.CORE.MODULE_ORG_ACCESS, {
                target, id, organization_id: organizationId, grant,
            });
            setData(prev => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                const applyToggle = (obj) => {
                    const ids = new Set(obj.organization_ids);
                    grant ? ids.add(organizationId) : ids.delete(organizationId);
                    obj.organization_ids = Array.from(ids);
                };
                for (const m of next.modules) {
                    if (target === 'module' && m.id === id) applyToggle(m);
                    if (target === 'sub_module') {
                        const sub = m.sub_modules.find(s => s.id === id);
                        if (sub) applyToggle(sub);
                    }
                }
                return next;
            });
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSavingKey(null);
        }
    }

    async function togglePublic(moduleId, grant) {
        const key = `module_public:${moduleId}:public`;
        setSavingKey(key);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.CORE.MODULE_ORG_ACCESS, {
                target: 'module_public', id: moduleId, grant,
            });
            setData(prev => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                const m = next.modules.find(m => m.id === moduleId);
                if (m) m.is_public = grant;
                return next;
            });
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSavingKey(null);
        }
    }

    if (loading) {
        return <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={26} sx={{color: C.gold}}/></Box>;
    }
    if (!data || !data.organizations?.length || !data.modules?.length) {
        return <Typography sx={{color: C.inkMuted, fontSize: 13.5, py: 3}}>Göstəriləcək modul və ya qurum yoxdur.</Typography>;
    }

    const rows = [];
    data.modules.forEach(m => {
        rows.push({...m, isSub: false});
        m.sub_modules.forEach(sm => rows.push({...sm, isSub: true, parentTitle: m.title, parentPublic: m.is_public}));
    });

    return (
        <Box sx={{overflowX: 'auto'}}>
            <Box sx={{display: 'table', width: '100%', borderCollapse: 'collapse', minWidth: 420 + data.organizations.length * 120}}>
                {/* header */}
                <Box sx={{display: 'table-row'}}>
                    <Box sx={{
                        display: 'table-cell', p: 1.25, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase',
                        color: C.inkFaint, borderBottom: `1px solid ${C.lineStrong}`, position: 'sticky', left: 0,
                        backgroundColor: C.surface, minWidth: 260,
                    }}>
                        Modul / Alt modul
                    </Box>
                    <Box sx={{
                        display: 'table-cell', p: 1.25, fontSize: 11.5, fontWeight: 700, color: C.gold,
                        borderBottom: `1px solid ${C.lineStrong}`, textAlign: 'center', minWidth: 110,
                    }}>
                        Hər kəsə açıq
                    </Box>
                    {data.organizations.map(org => (
                        <Box key={org.id} sx={{
                            display: 'table-cell', p: 1.25, fontSize: 11.5, fontWeight: 700, color: C.ink,
                            borderBottom: `1px solid ${C.lineStrong}`, textAlign: 'center', minWidth: 120,
                        }}>
                            {org.title}
                        </Box>
                    ))}
                </Box>

                {rows.map(row => {
                    return (
                        <Box key={`${row.isSub ? 'sub' : 'mod'}-${row.id}`} sx={{display: 'table-row', '&:hover': {backgroundColor: 'rgba(0,0,0,0.015)'}}}>
                            <Box sx={{
                                display: 'table-cell', p: 1.25, borderBottom: `1px solid ${C.line}`, position: 'sticky', left: 0,
                                backgroundColor: C.surface,
                            }}>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, pl: row.isSub ? 2.5 : 0}}>
                                    {row.isSub && <SubdirectoryArrowRightIcon sx={{fontSize: 15, color: C.inkFaint}}/>}
                                    <Typography sx={{fontSize: 13.5, fontWeight: row.isSub ? 500 : 700, color: C.ink}}>
                                        {row.title}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{display: 'table-cell', p: 0.5, borderBottom: `1px solid ${C.line}`, textAlign: 'center'}}>
                                {row.isSub ? (
                                    row.parentPublic ? (
                                        <Tooltip title="Əsas modul hər kəsə açıq olduğu üçün bu alt modul da avtomatik açıqdır">
                                            <span>
                                                <Checkbox size="small" checked disabled
                                                          sx={{'&.Mui-checked.Mui-disabled': {color: C.goldMuted}}}/>
                                            </span>
                                        </Tooltip>
                                    ) : (
                                        <Typography sx={{fontSize: 11, color: C.inkFaint}}>—</Typography>
                                    )
                                ) : savingKey === `module_public:${row.id}:public` ? (
                                    <CircularProgress size={16} sx={{color: C.gold}}/>
                                ) : (
                                    <Tooltip title="Aktiv edilsə, bu modul və alt modulları bütün istifadəçilərə açıq olur">
                                        <Checkbox
                                            size="small"
                                            checked={!!row.is_public}
                                            onChange={(e) => togglePublic(row.id, e.target.checked)}
                                            sx={{color: C.lineStrong, '&.Mui-checked': {color: C.gold}}}
                                        />
                                    </Tooltip>
                                )}
                            </Box>
                            {data.organizations.map(org => {
                                const target = row.isSub ? 'sub_module' : 'module';
                                const checked = row.organization_ids.includes(org.id);
                                const key = `${target}:${row.id}:${org.id}`;
                                const disabled = row.isSub ? row.parentPublic : row.is_public;
                                return (
                                    <Box key={org.id} sx={{display: 'table-cell', p: 0.5, borderBottom: `1px solid ${C.line}`, textAlign: 'center'}}>
                                        {savingKey === key ? (
                                            <CircularProgress size={16} sx={{color: C.gold}}/>
                                        ) : (
                                            <Tooltip title={disabled ? 'Bu modul hər kəsə açıqdır - qurum əsaslı giriş artıq lazım deyil' : ''}>
                                            <span>
                                                <Checkbox
                                                    size="small"
                                                    checked={disabled ? true : checked}
                                                    disabled={disabled}
                                                    onChange={(e) => toggle(target, row.id, org.id, e.target.checked)}
                                                    sx={{color: C.lineStrong, '&.Mui-checked': {color: C.gold}}}
                                                />
                                            </span>
                                            </Tooltip>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}

/* ---------------------------------------------------------------------- */
/* Seçilmiş qurumun (superuser üçün seçilə bilən, org admin üçün öz       */
/* qurumu) istifadəçilərinə modul/alt-modul girişi vermə paneli.          */
/*                                                                        */
/* Solda modul / alt modul siyahısı, sağda seçilmiş modul üzrə işçilər -  */
/* şöbələrə görə qruplaşdırılmış, axtarış və filtr ilə.                   */
/* ---------------------------------------------------------------------- */
const FILTERS = [
    {key: 'all', label: 'Hamısı'},
    {key: 'granted', label: 'Girişi olanlar'},
    {key: 'denied', label: 'Girişi olmayanlar'},
    {key: 'admins', label: 'Adminlər'},
];

function initials(name) {
    return (name || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* İstifadəçinin bu modul / alt modul üzrə vəziyyəti (kilidlər və izahlar). */
function userState(u, isSubModule) {
    const implicit = !!u.implicit_access;
    const isModuleAdmin = !!u.is_module_admin;
    const isSubAdmin = !!u.is_sub_module_admin;
    // Superuser / qurum admini və modul admini avtomatik girişə malikdir - "giriş"
    // açarını söndürmək heç nəyə təsir etmir, ona görə açar kilidlənir.
    const accessLocked = implicit || isModuleAdmin || (isSubModule && isSubAdmin);
    // Admin seçimi yalnız superuser/qurum admini üçün və (alt modulda) əsas modul
    // admini üçün kilidlidir. Adi istifadəçinin admin statusu həmişə dəyişdirilə bilər.
    const adminLocked = implicit || (isSubModule && isModuleAdmin);
    const adminChecked = isSubModule ? (isSubAdmin || isModuleAdmin) : isModuleAdmin;

    let accessTooltip = '';
    if (implicit) {
        accessTooltip = 'Avtomatik giriş (superuser / qurum admini) - dəyişdirilə bilməz';
    } else if (isSubModule && isModuleAdmin) {
        accessTooltip = 'Əsas modulun admini olduğu üçün bütün alt modullarda avtomatik admindir.';
    } else if (isModuleAdmin || (isSubModule && isSubAdmin)) {
        accessTooltip = 'Admin olduğu üçün girişi avtomatikdir. Girişi söndürmək üçün əvvəlcə admin statusunu ləğv edin.';
    }
    return {implicit, accessLocked, adminLocked, adminChecked, accessTooltip};
}

function UserAccessPanel({organizationId, showOrgPicker, organizations, onOrgChange}) {
    const {enqueueSnackbar} = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null); // {organization, modules}
    const [savingKeys, setSavingKeys] = useState(() => new Set());
    const [bulkKey, setBulkKey] = useState(null);
    const [selected, setSelected] = useState(null); // {type: 'module'|'sub', id}
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');

    // Yalnız bir qurum varsa, avtomatik seçilir
    useEffect(() => {
        if (showOrgPicker && !organizationId && organizations?.length === 1) onOrgChange(organizations[0].id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showOrgPicker, organizationId, organizations]);

    const load = useCallback(async () => {
        if (showOrgPicker && !organizationId) { setData(null); setLoading(false); return; }
        setLoading(true);
        try {
            const params = organizationId ? `?organization=${organizationId}` : '';
            const res = await service_api.get(NEXT_API_ENDPOINTS.CORE.ORG_MODULE_ACCESS + params);
            setData(res.data);
            setSelected(prev => {
                if (prev) return prev;
                const first = res.data?.modules?.[0];
                return first ? {type: 'module', id: first.id} : null;
            });
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId]);

    useEffect(() => { load(); }, [load]);

    async function toggle(target, id, userId, grant, {silent = false} = {}) {
        const key = `${target}:${id}:${userId}`;
        setSavingKeys(prev => new Set(prev).add(key));
        try {
            const payload = {target, id, user_id: userId, grant};
            if (organizationId) payload.organization = organizationId;
            await service_api.post(NEXT_API_ENDPOINTS.CORE.ORG_MODULE_ACCESS, payload);
            setData(prev => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                const applyToggle = (obj) => {
                    obj.users = obj.users.map(u => {
                        if (u.id !== userId) return u;
                        if (target === 'module_admin') {
                            // Modul admini təyin olunanda avtomatik giriş də alır (backend-də olduğu kimi);
                            // geri alınanda giriş (permitted_users) dəyişmir, yalnız admin statusu düşür.
                            return {...u, is_module_admin: grant, has_access: grant ? true : u.has_access};
                        }
                        if (target === 'sub_module_admin') {
                            return {...u, is_sub_module_admin: grant, has_access: grant ? true : u.has_access};
                        }
                        return {...u, has_access: grant};
                    });
                };
                for (const m of next.modules) {
                    if ((target === 'module' || target === 'module_admin') && m.id === id) applyToggle(m);
                    if (target === 'sub_module' || target === 'sub_module_admin') {
                        const sub = m.sub_modules.find(s => s.id === id);
                        if (sub) applyToggle(sub);
                    }
                }
                return next;
            });
            return true;
        } catch (err) {
            if (!silent) enqueueSnackbar(handleError(err), {variant: 'error'});
            return false;
        } finally {
            setSavingKeys(prev => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    }

    // Seçilmiş modul / alt modul
    let current = null;
    if (data && selected) {
        for (const m of data.modules) {
            if (selected.type === 'module' && m.id === selected.id) current = {obj: m, isSub: false, parent: null};
            const sub = m.sub_modules?.find(s => selected.type === 'sub' && s.id === selected.id);
            if (sub) current = {obj: sub, isSub: true, parent: m};
        }
    }

    const accessTarget = current?.isSub ? 'sub_module' : 'module';
    const adminTarget = current?.isSub ? 'sub_module_admin' : 'module_admin';

    // Axtarış + filtr + şöbələrə görə qruplaşdırma
    const groups = useMemo(() => {
        if (!current) return [];
        const q = query.trim().toLocaleLowerCase('az');
        const list = current.obj.users.filter(u => {
            const st = userState(u, current.isSub);
            if (filter === 'granted' && !u.has_access) return false;
            if (filter === 'denied' && u.has_access) return false;
            if (filter === 'admins' && !st.adminChecked) return false;
            if (!q) return true;
            return [u.name, u.username, u.role_title, u.department_title]
                .some(v => (v || '').toLocaleLowerCase('az').includes(q));
        });
        const map = new Map();
        for (const u of list) {
            const key = u.department_id || 0;
            if (!map.has(key)) map.set(key, {id: key, title: u.department_title || 'Şöbəsi təyin edilməyib', users: []});
            map.get(key).users.push(u);
        }
        return Array.from(map.values()).sort((a, b) => (a.id || 1e9) - (b.id || 1e9));
    }, [current, query, filter]);

    async function bulk(group, grant) {
        const targets = group.users.filter(u => !userState(u, current.isSub).accessLocked && u.has_access !== grant);
        if (!targets.length) return;
        setBulkKey(`${group.id}:${grant}`);
        let failed = 0;
        for (const u of targets) {
            const ok = await toggle(accessTarget, current.obj.id, u.id, grant, {silent: true});
            if (!ok) failed += 1;
        }
        setBulkKey(null);
        if (failed) enqueueSnackbar(`${failed} istifadəçi üçün dəyişiklik alınmadı.`, {variant: 'error'});
        else enqueueSnackbar(grant ? `${targets.length} nəfərə giriş verildi.` : `${targets.length} nəfərin girişi geri alındı.`, {variant: 'success'});
    }

    const countOf = (obj) => obj.users.filter(u => u.has_access).length;

    const orgPicker = showOrgPicker && (organizations || []).length > 1 && (
        <FormControl size="small" sx={{minWidth: 280}}>
            <InputLabel>Qurum seçin</InputLabel>
            <Select label="Qurum seçin" value={organizationId || ''} onChange={(e) => { setSelected(null); onOrgChange(e.target.value); }}>
                {(organizations || []).map(org => (
                    <MenuItem key={org.id} value={org.id}>{org.title}</MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    if (showOrgPicker && !organizationId) {
        return (
            <Box>
                {orgPicker && <Box sx={{mb: 2}}>{orgPicker}</Box>}
                <Typography sx={{color: C.inkMuted, fontSize: 13.5}}>
                    İstifadəçi girişlərini idarə etmək üçün əvvəlcə qurum seçin.
                </Typography>
            </Box>
        );
    }
    if (loading) {
        return <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={26} sx={{color: C.gold}}/></Box>;
    }
    if (!data || !data.modules?.length) {
        return (
            <Box>
                {orgPicker && <Box sx={{mb: 2}}>{orgPicker}</Box>}
                <Typography sx={{color: C.inkMuted, fontSize: 13.5, py: 2}}>
                    Bu qurum üçün açıq heç bir modul yoxdur. Modulları qurumlara açmaq üçün "Qurum girişləri" bölməsindən istifadə edin.
                </Typography>
            </Box>
        );
    }

    const navItem = (obj, isSub, parentTitle) => {
        const active = selected && selected.id === obj.id && (selected.type === 'sub') === isSub;
        const granted = countOf(obj);
        return (
            <Box
                key={`${isSub ? 's' : 'm'}-${obj.id}`}
                component="button" type="button"
                onClick={() => setSelected({type: isSub ? 'sub' : 'module', id: obj.id})}
                title={isSub ? `${parentTitle} / ${obj.title}` : obj.title}
                sx={{
                    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%',
                    display: 'flex', alignItems: 'center', gap: 1,
                    pl: isSub ? 3.5 : 1.5, pr: 1.25, py: isSub ? 0.85 : 1.1, borderRadius: '8px',
                    backgroundColor: active ? C.goldTint : 'transparent',
                    boxShadow: active ? `inset 3px 0 0 ${C.gold}` : 'none',
                    transition: 'background-color .15s ease',
                    '&:hover': {backgroundColor: active ? C.goldTint : C.surfaceRaised},
                    '&:focus-visible': {outline: `2px solid ${C.gold}`, outlineOffset: 1},
                }}
            >
                {isSub
                    ? <SubdirectoryArrowRightIcon sx={{fontSize: 14, color: C.inkFaint}}/>
                    : <ExtensionOutlinedIcon sx={{fontSize: 16, color: active ? C.gold : C.inkFaint}}/>}
                <Typography noWrap sx={{flex: 1, fontSize: isSub ? 12.5 : 13.5, fontWeight: isSub ? 500 : 650, color: active ? C.ink : C.inkMuted}}>
                    {obj.title}
                </Typography>
                <Typography sx={{
                    fontSize: 11, fontWeight: 650, px: 0.85, py: 0.15, borderRadius: 999, flexShrink: 0,
                    color: granted ? C.goldDeep : C.inkFaint, backgroundColor: granted ? C.goldTint : C.surfaceDeep,
                }}>
                    {granted}/{obj.users.length}
                </Typography>
            </Box>
        );
    };

    return (
        <Box>
            {orgPicker && <Box sx={{mb: 2.5}}>{orgPicker}</Box>}
            <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '300px 1fr'}, gap: 2.5, alignItems: 'start'}}>
                {/* Modullar */}
                <Box sx={{
                    border: `1px solid ${C.line}`, borderRadius: '12px', p: 1, backgroundColor: C.surface,
                    position: {md: 'sticky'}, top: {md: 140}, maxHeight: {xs: 280, md: 'calc(100vh - 170px)'}, overflowY: 'auto',
                }}>
                    <Typography sx={{px: 1.5, pt: 1, pb: 1, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.inkFaint, fontWeight: 600}}>
                        Modullar
                    </Typography>
                    {data.modules.map(m => (
                        <Box key={m.id}>
                            {navItem(m, false)}
                            {m.sub_modules?.map(s => navItem(s, true, m.title))}
                        </Box>
                    ))}
                </Box>

                {/* İşçilər */}
                {current && (
                    <Box sx={{border: `1px solid ${C.line}`, borderRadius: '12px', backgroundColor: C.surface, minWidth: 0}}>
                        <Box sx={{p: {xs: 2, sm: 2.5}, borderBottom: `1px solid ${C.line}`}}>
                            {current.isSub && (
                                <Typography sx={{fontSize: 11.5, color: C.inkFaint, mb: 0.25}}>{current.parent.title} · alt modul</Typography>
                            )}
                            <Box sx={{display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap'}}>
                                <Typography sx={{fontSize: 18, fontWeight: 700, color: C.ink}}>{current.obj.title}</Typography>
                                <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>
                                    {countOf(current.obj)} nəfərin girişi var
                                    {' · '}
                                    {current.obj.users.filter(u => userState(u, current.isSub).adminChecked).length} admin
                                </Typography>
                            </Box>
                            <Box sx={{display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap', alignItems: 'center'}}>
                                <TextField
                                    size="small" placeholder="Ad, vəzifə və ya şöbə üzrə axtarış" value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    sx={{flex: '1 1 260px', maxWidth: 420}}
                                    InputProps={{startAdornment: <InputAdornment position="start"><SearchIcon sx={{fontSize: 18, color: C.inkFaint}}/></InputAdornment>}}
                                />
                                <Box sx={{display: 'flex', gap: 0.75, flexWrap: 'wrap'}}>
                                    {FILTERS.map(f => (
                                        <Box key={f.key} component="button" type="button" onClick={() => setFilter(f.key)} sx={{
                                            all: 'unset', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, px: 1.5, py: 0.6, borderRadius: 999,
                                            border: `1px solid ${filter === f.key ? C.gold : C.line}`,
                                            color: filter === f.key ? C.goldDeep : C.inkMuted,
                                            backgroundColor: filter === f.key ? C.goldTint : 'transparent',
                                            '&:focus-visible': {outline: `2px solid ${C.gold}`, outlineOffset: 1},
                                        }}>
                                            {f.label}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        {/* Sütun başlıqları */}
                        <Box sx={{
                            display: {xs: 'none', sm: 'grid'}, gridTemplateColumns: '1fr 92px 72px', gap: 1, px: 2.5, py: 1,
                            backgroundColor: C.surfaceRaised, borderBottom: `1px solid ${C.line}`,
                            fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.inkFaint, fontWeight: 600,
                        }}>
                            <span>İşçi</span>
                            <Tooltip title="Modula giriş"><span style={{textAlign: 'center'}}>Giriş</span></Tooltip>
                            <Tooltip title={current.isSub ? 'Alt modul admini - yalnız bu alt modul daxilində idarəetmə' : 'Modul admini - bu modulda məzmun əlavə/redaktə səlahiyyəti'}>
                                <span style={{textAlign: 'center'}}>Admin</span>
                            </Tooltip>
                        </Box>

                        {groups.length === 0 ? (
                            <Typography sx={{p: 3, fontSize: 13.5, color: C.inkFaint}}>
                                {current.obj.users.length ? 'Axtarışa uyğun işçi tapılmadı.' : 'Bu qurumda aktiv işçi yoxdur.'}
                            </Typography>
                        ) : groups.map(group => {
                            const granted = group.users.filter(u => u.has_access).length;
                            const changeable = group.users.filter(u => !userState(u, current.isSub).accessLocked);
                            return (
                                <Box key={group.id}>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1, px: {xs: 2, sm: 2.5}, py: 1.1,
                                        backgroundColor: C.surfaceRaised, borderBottom: `1px solid ${C.line}`, flexWrap: 'wrap',
                                    }}>
                                        <AccountTreeOutlinedIcon sx={{fontSize: 16, color: C.inkFaint}}/>
                                        <Typography sx={{fontSize: 12.5, fontWeight: 650, color: C.ink, flex: 1, minWidth: 0}} noWrap>
                                            {group.title}
                                        </Typography>
                                        <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>{granted}/{group.users.length}</Typography>
                                        {changeable.length > 0 && (
                                            <Box sx={{display: 'flex', gap: 0.5}}>
                                                {[true, false].map(grant => {
                                                    const busy = bulkKey === `${group.id}:${grant}`;
                                                    const disabledBtn = !!bulkKey || changeable.every(u => u.has_access === grant);
                                                    return (
                                                        <Box key={String(grant)} component="button" type="button" disabled={disabledBtn}
                                                             onClick={() => bulk(group, grant)}
                                                             sx={{
                                                                 all: 'unset', cursor: disabledBtn ? 'default' : 'pointer', fontSize: 11.5, fontWeight: 600,
                                                                 px: 1, py: 0.35, borderRadius: '6px',
                                                                 color: disabledBtn ? C.inkFaint : (grant ? C.goldDeep : C.danger),
                                                                 opacity: disabledBtn && !busy ? 0.55 : 1,
                                                                 display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                                                 '&:hover': disabledBtn ? {} : {backgroundColor: grant ? C.goldTint : C.dangerTint},
                                                                 '&:focus-visible': {outline: `2px solid ${C.gold}`},
                                                             }}>
                                                            {busy && <CircularProgress size={11} sx={{color: 'inherit'}}/>}
                                                            {grant ? 'Hamısına ver' : 'Hamısından al'}
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    </Box>
                                    {group.users.map(u => {
                                        const st = userState(u, current.isSub);
                                        const accessKey = `${accessTarget}:${current.obj.id}:${u.id}`;
                                        const adminKey = `${adminTarget}:${current.obj.id}:${u.id}`;
                                        return (
                                            <Box key={u.id} sx={{
                                                display: 'grid', gridTemplateColumns: '1fr 92px 72px', gap: 1, alignItems: 'center',
                                                px: {xs: 2, sm: 2.5}, py: 1, borderBottom: `1px solid ${C.line}`,
                                                '&:hover': {backgroundColor: C.goldWash},
                                            }}>
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0}}>
                                                    <Box sx={{
                                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0, fontSize: 11.5, fontWeight: 700,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        backgroundColor: u.has_access ? C.goldTint : C.surfaceDeep,
                                                        color: u.has_access ? C.goldDeep : C.inkMuted,
                                                    }}>
                                                        {initials(u.name || u.username)}
                                                    </Box>
                                                    <Box sx={{minWidth: 0}}>
                                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75}}>
                                                            <Typography noWrap sx={{fontSize: 13.5, fontWeight: 600, color: C.ink}}>{u.name || u.username}</Typography>
                                                            {st.implicit && (
                                                                <Typography sx={{fontSize: 10, fontWeight: 700, color: C.goldDeep, backgroundColor: C.goldTint, px: 0.75, py: 0.1, borderRadius: '4px', flexShrink: 0}}>
                                                                    Avtomatik
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <Typography noWrap sx={{fontSize: 12, color: C.inkFaint}}>
                                                            {u.role_title || u.username}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box sx={{display: 'flex', justifyContent: 'center'}}>
                                                    {savingKeys.has(accessKey) ? (
                                                        <CircularProgress size={16} sx={{color: C.gold}}/>
                                                    ) : (
                                                        <Tooltip title={st.accessTooltip}>
                                                            <span>
                                                                <Switch
                                                                    size="small" checked={!!u.has_access} disabled={st.accessLocked || !!bulkKey}
                                                                    onChange={(e) => toggle(accessTarget, current.obj.id, u.id, e.target.checked)}
                                                                    inputProps={{'aria-label': `${u.name} - giriş`}}
                                                                />
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Box sx={{display: 'flex', justifyContent: 'center'}}>
                                                    {savingKeys.has(adminKey) ? (
                                                        <CircularProgress size={14} sx={{color: C.gold}}/>
                                                    ) : (
                                                        <Checkbox
                                                            size="small" checked={st.adminChecked} disabled={st.adminLocked || !!bulkKey}
                                                            onChange={(e) => toggle(adminTarget, current.obj.id, u.id, e.target.checked)}
                                                            inputProps={{'aria-label': `${u.name} - admin`}}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

/* ---------------------------------------------------------------------- */
/* Əsas komponent                                                         */
/* ---------------------------------------------------------------------- */
export default function ModulePermissionsPage({isSuperUser}) {
    const [subTab, setSubTab] = useState(0);
    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [orgOptions, setOrgOptions] = useState([]);
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        if (!isSuperUser) return;
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.CORE.MODULE_ORG_ACCESS);
                setOrgOptions(res.data?.organizations || []);
            } catch (err) {
                enqueueSnackbar(handleError(err), {variant: 'error'});
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuperUser]);

    if (!isSuperUser) {
        // Qurum admini - yalnız öz qurumunun istifadəçilərinə, artıq qurumuna
        // açılmış modullar daxilində giriş verə bilər.
        return (
            <Box sx={cardSx}>
                <Typography sx={{fontSize: 15, fontWeight: 700, color: C.ink, mb: 0.5}}>
                    Modul icazələri
                </Typography>
                <Typography sx={{fontSize: 13, color: C.inkMuted, mb: 2.5}}>
                    Qurumunuza açıq olan modullardan hansını hansı işçinizə vermək istədiyinizi seçin.
                </Typography>
                <UserAccessPanel organizationId={null} showOrgPicker={false}/>
            </Box>
        );
    }

    return (
        <Box sx={cardSx}>
            <Typography sx={{fontSize: 15, fontWeight: 700, color: C.ink, mb: 0.5}}>
                Modul icazələri
            </Typography>
            <Typography sx={{fontSize: 13, color: C.inkMuted, mb: 2}}>
                Modulları qurumlara açın, sonra həmin qurumun konkret işçilərinə giriş verin.
            </Typography>

            <Tabs
                value={subTab} onChange={(e, v) => setSubTab(v)}
                sx={{
                    mb: 2.5, minHeight: 36, borderBottom: `1px solid ${C.line}`,
                    '& .MuiTab-root': {textTransform: 'none', minHeight: 36, fontSize: 13.5, color: C.inkMuted, gap: 0.5},
                    '& .Mui-selected': {color: `${C.ink} !important`, fontWeight: 600},
                    '& .MuiTabs-indicator': {backgroundColor: C.gold},
                }}
            >
                <Tab label="Qurum girişləri" icon={<DomainOutlinedIcon sx={{fontSize: 17}}/>} iconPosition="start"/>
                <Tab label="İstifadəçi girişləri" icon={<GroupOutlinedIcon sx={{fontSize: 17}}/>} iconPosition="start"/>
            </Tabs>

            {subTab === 0 ? (
                <OrgAccessMatrix/>
            ) : (
                <UserAccessPanel
                    organizationId={selectedOrgId}
                    showOrgPicker
                    organizations={orgOptions}
                    onOrgChange={setSelectedOrgId}
                />
            )}
        </Box>
    );
}
"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";

const C = {
    surface: '#FFFFFF',
    line: '#E4E1D8',
    lineStrong: '#D0CCC0',
    ink: '#1D1B16',
    inkMuted: '#6B6558',
    inkFaint: '#948D7C',
    gold: '#9C7A2E',
    goldTint: 'rgba(156,122,46,0.1)',
};

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

    if (loading) {
        return <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={26} sx={{color: C.gold}}/></Box>;
    }
    if (!data || !data.organizations?.length || !data.modules?.length) {
        return <Typography sx={{color: C.inkMuted, fontSize: 13.5, py: 3}}>Göstəriləcək modul və ya qurum yoxdur.</Typography>;
    }

    const rows = [];
    data.modules.forEach(m => {
        rows.push({...m, isSub: false});
        m.sub_modules.forEach(sm => rows.push({...sm, isSub: true, parentTitle: m.title}));
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
                    {data.organizations.map(org => (
                        <Box key={org.id} sx={{
                            display: 'table-cell', p: 1.25, fontSize: 11.5, fontWeight: 700, color: C.ink,
                            borderBottom: `1px solid ${C.lineStrong}`, textAlign: 'center', minWidth: 120,
                        }}>
                            {org.title}
                        </Box>
                    ))}
                </Box>

                {rows.map(row => (
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
                        {data.organizations.map(org => {
                            const target = row.isSub ? 'sub_module' : 'module';
                            const checked = row.organization_ids.includes(org.id);
                            const key = `${target}:${row.id}:${org.id}`;
                            return (
                                <Box key={org.id} sx={{display: 'table-cell', p: 0.5, borderBottom: `1px solid ${C.line}`, textAlign: 'center'}}>
                                    {savingKey === key ? (
                                        <CircularProgress size={16} sx={{color: C.gold}}/>
                                    ) : (
                                        <Checkbox
                                            size="small"
                                            checked={checked}
                                            onChange={(e) => toggle(target, row.id, org.id, e.target.checked)}
                                            sx={{color: C.lineStrong, '&.Mui-checked': {color: C.gold}}}
                                        />
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

/* ---------------------------------------------------------------------- */
/* Seçilmiş qurumun (superuser üçün seçilə bilən, org admin üçün öz       */
/* qurumu) istifadəçilərinə modul/alt-modul girişi vermə paneli.          */
/* ---------------------------------------------------------------------- */
function UserAccessPanel({organizationId, showOrgPicker, organizations, onOrgChange}) {
    const {enqueueSnackbar} = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null); // {organization, modules}
    const [savingKey, setSavingKey] = useState(null);

    const load = useCallback(async () => {
        if (showOrgPicker && !organizationId) { setData(null); setLoading(false); return; }
        setLoading(true);
        try {
            const params = organizationId ? `?organization=${organizationId}` : '';
            const res = await service_api.get(NEXT_API_ENDPOINTS.CORE.ORG_MODULE_ACCESS + params);
            setData(res.data);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId]);

    useEffect(() => { load(); }, [load]);

    async function toggle(target, id, userId, grant) {
        const key = `${target}:${id}:${userId}`;
        setSavingKey(key);
        try {
            const payload = {target, id, user_id: userId, grant};
            if (organizationId) payload.organization = organizationId;
            await service_api.post(NEXT_API_ENDPOINTS.CORE.ORG_MODULE_ACCESS, payload);
            setData(prev => {
                if (!prev) return prev;
                const next = structuredClone(prev);
                const applyToggle = (obj) => {
                    obj.users = obj.users.map(u => u.id === userId ? {...u, has_access: grant} : u);
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

    return (
        <Box>
            {showOrgPicker && (
                <FormControl size="small" sx={{minWidth: 280, mb: 3}}>
                    <InputLabel>Qurum seçin</InputLabel>
                    <Select
                        label="Qurum seçin"
                        value={organizationId || ''}
                        onChange={(e) => onOrgChange(e.target.value)}
                    >
                        {(organizations || []).map(org => (
                            <MenuItem key={org.id} value={org.id}>{org.title}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {showOrgPicker && !organizationId ? (
                <Typography sx={{color: C.inkMuted, fontSize: 13.5}}>
                    İstifadəçi girişlərini idarə etmək üçün əvvəlcə qurum seçin.
                </Typography>
            ) : loading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={26} sx={{color: C.gold}}/></Box>
            ) : !data || !data.modules?.length ? (
                <Typography sx={{color: C.inkMuted, fontSize: 13.5, py: 2}}>
                    Bu qurum üçün açıq heç bir modul yoxdur. Modulları qurumlara açmaq üçün "Qurum girişləri" bölməsindən istifadə edin.
                </Typography>
            ) : (
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                    {data.modules.map(module => (
                        <Box key={module.id} sx={{border: `1px solid ${C.line}`, borderRadius: '8px', overflow: 'hidden'}}>
                            <Box sx={{p: 1.5, backgroundColor: C.goldTint, display: 'flex', alignItems: 'center', gap: 1}}>
                                <ExtensionOutlinedIcon sx={{fontSize: 17, color: C.gold}}/>
                                <Typography sx={{fontSize: 14, fontWeight: 700, color: C.ink}}>{module.title}</Typography>
                            </Box>
                            <Box sx={{p: 1.5}}>
                                <UserGrantList
                                    users={module.users}
                                    savingKey={savingKey}
                                    targetKey={(u) => `module:${module.id}:${u.id}`}
                                    onToggle={(u, grant) => toggle('module', module.id, u.id, grant)}
                                />
                                {module.sub_modules?.map(sub => (
                                    <Box key={sub.id} sx={{mt: 1.5, pl: 2.5, borderLeft: `2px solid ${C.line}`}}>
                                        <Typography sx={{fontSize: 12.5, fontWeight: 600, color: C.inkMuted, mb: 0.5}}>
                                            {sub.title}
                                        </Typography>
                                        <UserGrantList
                                            users={sub.users}
                                            savingKey={savingKey}
                                            targetKey={(u) => `sub_module:${sub.id}:${u.id}`}
                                            onToggle={(u, grant) => toggle('sub_module', sub.id, u.id, grant)}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

function UserGrantList({users, savingKey, targetKey, onToggle}) {
    if (!users?.length) {
        return <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>Bu qurumda aktiv işçi yoxdur.</Typography>;
    }
    return (
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
            {users.map(u => {
                const key = targetKey(u);
                const isSaving = savingKey === key;
                return (
                    <Box
                        key={u.id}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5, pl: 1, pr: 0.5, py: 0.25,
                            border: `1px solid ${u.has_access ? C.gold : C.line}`,
                            backgroundColor: u.has_access ? C.goldTint : 'transparent',
                            borderRadius: '999px',
                        }}
                    >
                        <Typography sx={{fontSize: 12.5, color: C.ink}}>{u.name || u.username}</Typography>
                        {isSaving ? (
                            <CircularProgress size={14} sx={{color: C.gold, mx: 0.5}}/>
                        ) : (
                            <Switch
                                size="small"
                                checked={u.has_access}
                                onChange={(e) => onToggle(u, e.target.checked)}
                                sx={{'& .MuiSwitch-switchBase.Mui-checked': {color: C.gold}, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {backgroundColor: C.gold}}}
                            />
                        )}
                    </Box>
                );
            })}
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
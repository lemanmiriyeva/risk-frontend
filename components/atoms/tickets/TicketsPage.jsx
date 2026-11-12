"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import ModuleHero from "@/components/ModuleHero";
import {GOV, C} from "@/components/theme/tokens";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {DATA_GRID_LOCALE_AZ} from "@/lib/dataGridLocaleAz";
import TicketFormDialog from "./TicketFormDialog";
import TicketStats from "./TicketStats";
import {DeptList, PriorityChip, SlaBadge, StatusChip} from "./TicketBadges";
import {STATUS_META, timeAgo} from "./ticketMeta";

const TABS = [
    {value: 'all', label: 'Hamısı'},
    {value: 'mine', label: 'Mənim müraciətlərim'},
    {value: 'assigned', label: 'Mənə təyin edilən'},
    {value: 'department', label: 'Şöbəmin'},
    {value: 'watching', label: 'İzlədiklərim'},
];

const STATUS_FILTERS = [
    {value: '', label: 'Bütün statuslar'},
    {value: 'new,open,in_progress,waiting', label: 'Aktiv müraciətlər'},
    ...Object.entries(STATUS_META).map(([value, m]) => ({value, label: m.label})),
];

const gridSx = {
    border: `1px solid ${C.line}`, borderRadius: '4px', backgroundColor: C.surface,
    '& .MuiDataGrid-columnHeaders': {backgroundColor: C.surface, borderBottom: `1px solid ${C.lineStrong}`},
    '& .MuiDataGrid-columnHeaderTitle': {fontSize: 11, letterSpacing: '0.05em', color: C.inkFaint, textTransform: 'uppercase', fontWeight: 500},
    '& .MuiDataGrid-cell': {borderBottom: `1px solid ${C.line}`, fontSize: 13.5, color: C.ink, display: 'flex', alignItems: 'center'},
    '& .MuiDataGrid-row': {cursor: 'pointer'},
    '& .MuiDataGrid-row:hover': {backgroundColor: 'rgba(0,0,0,0.015)'},
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {outline: 'none'},
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {outline: 'none'},
};

export default function TicketsPage() {
    const {enqueueSnackbar} = useSnackbar();
    const router = useRouter();

    const [meta, setMeta] = useState(null);
    const [stats, setStats] = useState(null);
    const [rows, setRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [status, setStatus] = useState('');
    const [priority, setPriority] = useState('');
    const [category, setCategory] = useState('');
    const [department, setDepartment] = useState('');
    const [quick, setQuick] = useState('');
    const ordering = '-last_activity_at';
    const [paging, setPaging] = useState({page: 0, pageSize: 20});
    const [formOpen, setFormOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim()), 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        service_api.get(NEXT_API_ENDPOINTS.TICKETS.META).then((r) => setMeta(r.data)).catch((e) => enqueueSnackbar(handleError(e), {variant: 'error'}));
    }, [enqueueSnackbar]);

    const buildParams = useCallback((extra = {}) => {
        const p = new URLSearchParams();
        if (tab !== 'all') p.set('scope', tab);
        if (debounced) p.set('search', debounced);
        if (status) p.set('status', status);
        if (priority) p.set('priority', priority);
        if (category) p.set('category', category);
        if (department) p.set('department', department);
        if (quick === 'overdue') p.set('overdue', 'true');
        if (quick === 'unassigned') p.set('unassigned', 'true');
        if (quick === 'active' && !status) p.set('active', 'true');
        Object.entries(extra).forEach(([k, v]) => p.set(k, v));
        return p;
    }, [tab, debounced, status, priority, category, department, quick]);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const extra = {page: paging.page + 1, page_size: paging.pageSize, ordering};
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.TICKETS.LIST}?${buildParams(extra)}`);
            setRows(res.data.results || []);
            setRowCount(res.data.count || 0);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [buildParams, paging, enqueueSnackbar]);

    const fetchStats = useCallback(async () => {
        try {
            const p = new URLSearchParams();
            if (tab !== 'all') p.set('scope', tab);
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.TICKETS.STATS}?${p}`);
            setStats(res.data);
        } catch {
            setStats(null);
        }
    }, [tab]);

    useEffect(() => { fetchRows(); }, [fetchRows]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    // filtr dəyişəndə 1-ci səhifəyə qayıt
    useEffect(() => {
        setPaging((p) => (p.page === 0 ? p : {...p, page: 0}));
    }, [tab, debounced, status, priority, category, department, quick]);

    function onQuick(q) {
        setQuick((cur) => (cur === q ? '' : q));
        if (q === 'overdue' || q === 'unassigned') setStatus('');
    }

    function resetFilters() {
        setSearch(''); setStatus(''); setPriority(''); setCategory(''); setDepartment(''); setQuick(''); setTab('all');
    }

    const columns = useMemo(() => [
        {field: 'number', headerName: '№', width: 110, sortable: false,
            renderCell: (p) => <Typography sx={{fontSize: 13, fontWeight: 600, color: C.ink}}>{p.value}</Typography>},
        {field: 'title', headerName: 'Mövzu', flex: 1.6, minWidth: 260, sortable: false,
            renderCell: (p) => (
                <Box sx={{minWidth: 0, py: 0.75}}>
                    <Typography noWrap sx={{fontSize: 13.5, fontWeight: 500}}>{p.value}</Typography>
                    <Typography noWrap sx={{fontSize: 12, color: C.inkFaint}}>
                        {p.row.category_title || p.row.type_display}
                        {p.row.comment_count ? ` · ${p.row.comment_count} şərh` : ''}
                    </Typography>
                </Box>
            )},
        {field: 'status', headerName: 'Status', width: 160, sortable: false,
            renderCell: (p) => <StatusChip status={p.value} label={p.row.status_display}/>},
        {field: 'priority', headerName: 'Prioritet', width: 120, sortable: false,
            renderCell: (p) => <PriorityChip priority={p.value} label={p.row.priority_display}/>},
        {field: 'departments', headerName: 'Şöbələr', flex: 1.1, minWidth: 190, sortable: false,
            renderCell: (p) => <DeptList departments={p.value}/>},
        {field: 'requester_name', headerName: 'Müraciətçi', width: 170, sortable: false,
            renderCell: (p) => (
                <Box sx={{minWidth: 0}}>
                    <Typography noWrap sx={{fontSize: 13}}>{p.value}</Typography>
                    <Typography noWrap sx={{fontSize: 11.5, color: C.inkFaint}}>{p.row.requester_department}</Typography>
                </Box>
            )},
        {field: 'assignee_name', headerName: 'İcraçı', width: 150, sortable: false,
            valueGetter: (v, row) => row.assignee_name || '—'},
        {field: 'due_at', headerName: 'SLA', width: 150, sortable: false,
            renderCell: (p) => <SlaBadge ticket={p.row}/>},
        {field: 'last_activity_at', headerName: 'Son fəaliyyət', width: 130, sortable: false,
            valueGetter: (v, row) => timeAgo(row.last_activity_at)},
        {field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, disableColumnMenu: true,
            renderCell: (p) => (
                <Button size="small" variant="outlined" component={Link} href={`/muracietler/${p.row.id}`} onClick={(e) => e.stopPropagation()}>
                    Bax
                </Button>
            )},
    ], []);

    const open = (t) => router.push(`/muracietler/${t.id}`);

    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Modul"
                title="Müraciətlər"
                breadcrumb={["Müraciətlər"]}
                icon={<ConfirmationNumberOutlinedIcon sx={{fontSize: 26}}/>}
                actions={(
                    <>
                        {meta?.is_admin && (
                            <Button component={Link} href="/muracietler/kateqoriyalar" variant="outlined" startIcon={<SettingsOutlinedIcon/>}>
                                Kateqoriyalar
                            </Button>
                        )}
                        <Button variant="contained" startIcon={<AddIcon/>} onClick={() => setFormOpen(true)} disabled={!meta}>
                            Yeni müraciət
                        </Button>
                    </>
                )}
            />

            <Box sx={{maxWidth: 1440, mx: 'auto', px: {xs: 2, sm: 4}, py: 4}}>
                <TicketStats stats={stats} quick={quick} onQuick={onQuick}/>

                <Tabs
                    value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
                    sx={{mb: 2, borderBottom: `1px solid ${C.line}`, '& .MuiTab-root': {textTransform: 'none', fontWeight: 500, fontSize: 14}}}
                >
                    {TABS.map((t) => <Tab key={t.value} value={t.value} label={t.label}/>)}
                </Tabs>

                <Box sx={{display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center'}}>
                    <TextField
                        size="small" placeholder="Axtarış: mövzu, təsvir, №, müraciətçi..." value={search}
                        onChange={(e) => setSearch(e.target.value)} sx={{minWidth: 280, flex: '1 1 280px', maxWidth: 420}}
                        InputProps={{startAdornment: <SearchIcon sx={{mr: 1, fontSize: 18, color: C.inkFaint}}/>}}
                    />
                    <TextField select size="small" value={status} onChange={(e) => {setStatus(e.target.value); setQuick('');}} sx={{minWidth: 180}}>
                        {STATUS_FILTERS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                    </TextField>
                    <TextField select size="small" value={priority} onChange={(e) => setPriority(e.target.value)} sx={{minWidth: 150}}
                               SelectProps={{displayEmpty: true}}>
                        <MenuItem value="">Bütün prioritetlər</MenuItem>
                        {(meta?.priorities || []).map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                    </TextField>
                    <TextField select size="small" value={category} onChange={(e) => setCategory(e.target.value)} sx={{minWidth: 170}}
                               SelectProps={{displayEmpty: true}}>
                        <MenuItem value="">Bütün kateqoriyalar</MenuItem>
                        {(meta?.categories || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}
                    </TextField>
                    <TextField select size="small" value={department} onChange={(e) => setDepartment(e.target.value)} sx={{minWidth: 170, maxWidth: 240}}
                               SelectProps={{displayEmpty: true}}>
                        <MenuItem value="">Bütün şöbələr</MenuItem>
                        {(meta?.departments || []).map((d) => <MenuItem key={d.id} value={d.id}>{d.shortname || d.title}</MenuItem>)}
                    </TextField>
                    <Button variant="outlined" onClick={resetFilters}>Sıfırla</Button>
                </Box>

                <Box sx={{width: '100%'}}>
                    <DataGrid
                        rows={rows} columns={columns} rowCount={rowCount} loading={loading}
                        paginationMode="server" paginationModel={paging} onPaginationModelChange={setPaging}
                        pageSizeOptions={[10, 20, 50, 100]}
                        onRowClick={(p) => open(p.row)}
                        disableRowSelectionOnClick disableColumnFilter disableColumnMenu
                        getRowHeight={() => 'auto'} autoHeight
                        localeText={{...DATA_GRID_LOCALE_AZ, noRowsLabel: 'Müraciət tapılmadı'}}
                        sx={{...gridSx, '& .MuiDataGrid-cell': {...gridSx['& .MuiDataGrid-cell'], py: 0.5}}}
                    />
                </Box>
            </Box>

            <TicketFormDialog
                open={formOpen} onClose={() => setFormOpen(false)} meta={meta}
                onCreated={(t) => {setFormOpen(false); router.push(`/muracietler/${t.id}`);}}
            />
        </Box>
    );
}
--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: animals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.animals (
    id integer NOT NULL,
    identification_code text NOT NULL,
    species text NOT NULL,
    breed text NOT NULL,
    gender text NOT NULL,
    birth_date timestamp without time zone,
    weight integer,
    farm_id integer NOT NULL,
    status text DEFAULT 'healthy'::text NOT NULL,
    last_vaccine_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.animals OWNER TO neondb_owner;

--
-- Name: animals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.animals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.animals_id_seq OWNER TO neondb_owner;

--
-- Name: animals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.animals_id_seq OWNED BY public.animals.id;


--
-- Name: crops; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.crops (
    id integer NOT NULL,
    name text NOT NULL,
    sector text NOT NULL,
    area integer NOT NULL,
    planting_date timestamp without time zone,
    expected_harvest_date timestamp without time zone,
    status text DEFAULT 'growing'::text NOT NULL,
    farm_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.crops OWNER TO neondb_owner;

--
-- Name: crops_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.crops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crops_id_seq OWNER TO neondb_owner;

--
-- Name: crops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.crops_id_seq OWNED BY public.crops.id;


--
-- Name: farms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.farms (
    id integer NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    size integer,
    created_by integer,
    admin_id integer,
    description text,
    coordinates text,
    type text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.farms OWNER TO neondb_owner;

--
-- Name: farms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.farms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.farms_id_seq OWNER TO neondb_owner;

--
-- Name: farms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.farms_id_seq OWNED BY public.farms.id;


--
-- Name: goals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goals (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    assigned_to integer NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    crop_id integer,
    target_value numeric NOT NULL,
    actual_value numeric DEFAULT '0'::numeric,
    unit text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    completion_date timestamp without time zone,
    farm_id integer NOT NULL,
    created_by integer NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goals OWNER TO neondb_owner;

--
-- Name: goals_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goals_id_seq OWNER TO neondb_owner;

--
-- Name: goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goals_id_seq OWNED BY public.goals.id;


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    quantity integer NOT NULL,
    unit text NOT NULL,
    farm_id integer NOT NULL,
    minimum_level integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.inventory OWNER TO neondb_owner;

--
-- Name: inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_id_seq OWNER TO neondb_owner;

--
-- Name: inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    due_date timestamp without time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    assigned_to integer,
    category text NOT NULL,
    related_id integer,
    farm_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tasks OWNER TO neondb_owner;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO neondb_owner;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: user_farms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_farms (
    id integer NOT NULL,
    user_id integer NOT NULL,
    farm_id integer NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_farms OWNER TO neondb_owner;

--
-- Name: user_farms_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_farms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_farms_id_seq OWNER TO neondb_owner;

--
-- Name: user_farms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_farms_id_seq OWNED BY public.user_farms.id;


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    farm_id integer NOT NULL,
    module text NOT NULL,
    access_level text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_permissions OWNER TO neondb_owner;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_permissions_id_seq OWNER TO neondb_owner;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    role text DEFAULT 'employee'::text NOT NULL,
    language text DEFAULT 'pt'::text NOT NULL,
    farm_id integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: animals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.animals ALTER COLUMN id SET DEFAULT nextval('public.animals_id_seq'::regclass);


--
-- Name: crops id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crops ALTER COLUMN id SET DEFAULT nextval('public.crops_id_seq'::regclass);


--
-- Name: farms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.farms ALTER COLUMN id SET DEFAULT nextval('public.farms_id_seq'::regclass);


--
-- Name: goals id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goals ALTER COLUMN id SET DEFAULT nextval('public.goals_id_seq'::regclass);


--
-- Name: inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: user_farms id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_farms ALTER COLUMN id SET DEFAULT nextval('public.user_farms_id_seq'::regclass);


--
-- Name: user_permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: animals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.animals (id, identification_code, species, breed, gender, birth_date, weight, farm_id, status, last_vaccine_date, created_at) FROM stdin;
73	A1000	Cabra	Raça de Cabra	macho	2021-05-04 19:10:24.341	432	6	sick	2025-04-28 19:10:24.341	2025-05-04 19:10:24.379397
74	A1001	Vaca	Raça de Vaca	macho	2024-05-04 19:10:24.412	421	6	pregnant	2025-04-20 19:10:24.412	2025-05-04 19:10:24.444396
75	A1002	Vaca	Raça de Vaca	macho	2022-05-04 19:10:24.471	79	6	quarantine	2025-02-24 19:10:24.471	2025-05-04 19:10:24.504413
76	A1003	Boi	Raça de Boi	macho	2021-05-04 19:10:24.532	197	6	quarantine	2025-03-25 19:10:24.532	2025-05-04 19:10:24.566666
77	A1004	Ovelha	Raça de Ovelha	macho	2020-05-04 19:10:24.593	193	6	quarantine	2025-02-23 19:10:24.593	2025-05-04 19:10:24.626016
78	A1005	Vaca	Raça de Vaca	macho	2021-05-04 19:10:24.652	388	6	quarantine	2025-03-16 19:10:24.652	2025-05-04 19:10:24.686036
79	A1006	Boi	Raça de Boi	macho	2023-05-04 19:10:24.715	56	6	quarantine	2025-02-28 19:10:24.715	2025-05-04 19:10:24.747436
80	A1007	Boi	Raça de Boi	fêmea	2022-05-04 19:10:24.774	321	6	sick	2025-02-07 19:10:24.774	2025-05-04 19:10:24.809536
81	A1008	Galinha	Raça de Galinha	fêmea	2023-05-04 19:10:24.838	197	6	sick	2025-03-19 19:10:24.838	2025-05-04 19:10:24.87287
82	A1009	Cabra	Raça de Cabra	fêmea	2024-05-04 19:10:24.908	220	6	quarantine	2025-03-22 19:10:24.908	2025-05-04 19:10:24.958016
83	A1010	Vaca	Raça de Vaca	fêmea	2024-05-04 19:10:24.99	452	6	pregnant	2025-05-02 19:10:24.99	2025-05-04 19:10:25.023544
84	A1011	Boi	Raça de Boi	macho	2021-05-04 19:10:25.052	469	6	healthy	2025-04-10 19:10:25.052	2025-05-04 19:10:25.168977
85	A1012	Cabra	Raça de Cabra	fêmea	2023-05-04 19:10:25.197	380	6	healthy	2025-04-14 19:10:25.197	2025-05-04 19:10:25.233482
86	A1013	Boi	Raça de Boi	fêmea	2022-05-04 19:10:25.261	467	6	pregnant	2025-03-18 19:10:25.261	2025-05-04 19:10:25.294301
87	A1014	Galinha	Raça de Galinha	fêmea	2024-05-04 19:10:25.322	262	6	treatment	2025-03-28 19:10:25.322	2025-05-04 19:10:25.355417
88	A1015	Galinha	Raça de Galinha	fêmea	2020-05-04 19:10:25.383	522	6	quarantine	2025-02-18 19:10:25.383	2025-05-04 19:10:25.415755
89	A1016	Ovelha	Raça de Ovelha	fêmea	2022-05-04 19:10:25.444	203	6	quarantine	2025-04-07 19:10:25.444	2025-05-04 19:10:25.47875
90	A1017	Galinha	Raça de Galinha	macho	2022-05-04 19:10:25.506	233	6	pregnant	2025-05-01 19:10:25.506	2025-05-04 19:10:25.539849
91	A1018	Vaca	Raça de Vaca	fêmea	2021-05-04 19:10:25.566	50	6	healthy	2025-02-27 19:10:25.566	2025-05-04 19:10:25.602155
92	A1019	Galinha	Raça de Galinha	fêmea	2023-05-04 19:10:25.63	468	6	sick	2025-04-28 19:10:25.63	2025-05-04 19:10:25.662733
93	A1020	Cabra	Raça de Cabra	macho	2022-05-04 19:10:25.689	218	6	sick	2025-03-23 19:10:25.689	2025-05-04 19:10:25.721739
94	A1021	Vaca	Raça de Vaca	macho	2020-05-04 19:10:25.751	234	6	quarantine	2025-02-18 19:10:25.751	2025-05-04 19:10:25.784825
95	A1022	Vaca	Raça de Vaca	macho	2021-05-04 19:10:25.814	110	6	sick	2025-04-30 19:10:25.814	2025-05-04 19:10:25.851971
96	A1023	Vaca	Raça de Vaca	fêmea	2020-05-04 19:10:25.883	195	6	quarantine	2025-04-30 19:10:25.883	2025-05-04 19:10:25.916443
97	A1024	Galinha	Raça de Galinha	fêmea	2022-05-04 19:10:25.943	519	6	quarantine	2025-02-27 19:10:25.943	2025-05-04 19:10:25.977425
98	B2000	Vaca	Leiteira Holstein	macho	2020-05-04 19:10:26.006	515	7	quarantine	2025-03-18 19:10:26.006	2025-05-04 19:10:26.03974
99	B2001	Boi	Angus	macho	2022-05-04 19:10:26.067	285	7	treatment	2025-04-14 19:10:26.067	2025-05-04 19:10:26.101992
100	B2002	Vaca	Leiteira Holstein	fêmea	2020-05-04 19:10:26.134	450	7	quarantine	2025-04-28 19:10:26.134	2025-05-04 19:10:26.169359
101	B2003	Vaca	Leiteira Holstein	fêmea	2020-05-04 19:10:26.197	468	7	quarantine	2025-04-29 19:10:26.197	2025-05-04 19:10:26.231063
102	B2004	Vaca	Leiteira Holstein	macho	2020-05-04 19:10:26.261	217	7	quarantine	2025-03-02 19:10:26.261	2025-05-04 19:10:26.29433
103	B2005	Boi	Angus	fêmea	2021-05-04 19:10:26.321	249	7	pregnant	2025-02-11 19:10:26.321	2025-05-04 19:10:26.35819
104	A1000	Cabra	Raça de Cabra	macho	2021-05-04 19:13:03.022	481	6	treatment	2025-03-02 19:13:03.023	2025-05-04 19:13:05.624911
105	A1001	Ovelha	Raça de Ovelha	macho	2020-05-04 19:13:05.681	520	6	pregnant	2025-03-05 19:13:05.681	2025-05-04 19:13:05.71521
106	A1002	Vaca	Raça de Vaca	macho	2021-05-04 19:13:05.742	220	6	treatment	2025-04-19 19:13:05.742	2025-05-04 19:13:05.775375
107	A1003	Cabra	Raça de Cabra	fêmea	2023-05-04 19:13:05.803	251	6	quarantine	2025-03-09 19:13:05.803	2025-05-04 19:13:05.835075
108	A1004	Galinha	Raça de Galinha	fêmea	2020-05-04 19:13:05.864	430	6	pregnant	2025-03-08 19:13:05.864	2025-05-04 19:13:05.897748
109	A1005	Boi	Raça de Boi	fêmea	2022-05-04 19:13:05.925	293	6	quarantine	2025-03-28 19:13:05.925	2025-05-04 19:13:05.961895
110	A1006	Cabra	Raça de Cabra	macho	2020-05-04 19:13:05.99	307	6	pregnant	2025-04-13 19:13:05.99	2025-05-04 19:13:06.02532
111	A1007	Vaca	Raça de Vaca	macho	2020-05-04 19:13:06.052	241	6	sick	2025-03-19 19:13:06.052	2025-05-04 19:13:06.085336
112	A1008	Vaca	Raça de Vaca	fêmea	2023-05-04 19:13:06.113	124	6	quarantine	2025-04-18 19:13:06.113	2025-05-04 19:13:06.146814
113	A1009	Vaca	Raça de Vaca	macho	2023-05-04 19:13:06.174	328	6	treatment	2025-04-01 19:13:06.174	2025-05-04 19:13:06.207397
114	A1010	Boi	Raça de Boi	fêmea	2020-05-04 19:13:06.235	525	6	healthy	2025-04-16 19:13:06.235	2025-05-04 19:13:06.269608
115	A1011	Vaca	Raça de Vaca	fêmea	2022-05-04 19:13:06.297	227	6	quarantine	2025-03-13 19:13:06.298	2025-05-04 19:13:06.331038
116	A1012	Ovelha	Raça de Ovelha	fêmea	2024-05-04 19:13:06.359	488	6	quarantine	2025-03-17 19:13:06.359	2025-05-04 19:13:06.399559
117	A1013	Vaca	Raça de Vaca	fêmea	2022-05-04 19:13:06.429	498	6	quarantine	2025-04-13 19:13:06.429	2025-05-04 19:13:06.46385
118	A1014	Vaca	Raça de Vaca	fêmea	2020-05-04 19:13:06.491	217	6	pregnant	2025-02-08 19:13:06.491	2025-05-04 19:13:06.524374
119	A1015	Boi	Raça de Boi	macho	2021-05-04 19:13:06.551	417	6	quarantine	2025-04-08 19:13:06.551	2025-05-04 19:13:06.585213
120	A1016	Ovelha	Raça de Ovelha	macho	2024-05-04 19:13:06.613	62	6	quarantine	2025-04-13 19:13:06.613	2025-05-04 19:13:06.645614
121	A1017	Galinha	Raça de Galinha	fêmea	2022-05-04 19:13:06.677	286	6	healthy	2025-04-01 19:13:06.677	2025-05-04 19:13:06.711589
122	A1018	Boi	Raça de Boi	macho	2024-05-04 19:13:06.739	549	6	treatment	2025-03-17 19:13:06.739	2025-05-04 19:13:06.771887
123	A1019	Ovelha	Raça de Ovelha	fêmea	2024-05-04 19:13:06.8	241	6	pregnant	2025-04-28 19:13:06.8	2025-05-04 19:13:06.833377
124	A1020	Ovelha	Raça de Ovelha	fêmea	2020-05-04 19:13:06.861	398	6	quarantine	2025-04-21 19:13:06.861	2025-05-04 19:13:06.893696
125	A1021	Cabra	Raça de Cabra	fêmea	2024-05-04 19:13:06.921	221	6	quarantine	2025-03-12 19:13:06.921	2025-05-04 19:13:06.957291
126	A1022	Galinha	Raça de Galinha	macho	2023-05-04 19:13:06.985	132	6	treatment	2025-02-23 19:13:06.985	2025-05-04 19:13:07.017896
127	A1023	Boi	Raça de Boi	macho	2022-05-04 19:13:07.05	415	6	sick	2025-04-02 19:13:07.05	2025-05-04 19:13:07.082907
128	A1024	Galinha	Raça de Galinha	macho	2023-05-04 19:13:07.111	436	6	treatment	2025-04-26 19:13:07.111	2025-05-04 19:13:07.142562
129	B2000	Boi	Angus	fêmea	2023-05-04 19:13:07.171	310	7	treatment	2025-04-28 19:13:07.171	2025-05-04 19:13:07.20357
130	B2001	Vaca	Leiteira Holstein	fêmea	2020-05-04 19:13:07.231	624	7	quarantine	2025-02-21 19:13:07.231	2025-05-04 19:13:07.264245
131	B2002	Boi	Angus	fêmea	2022-05-04 19:13:07.291	372	7	healthy	2025-03-18 19:13:07.291	2025-05-04 19:13:07.324756
132	B2003	Boi	Angus	fêmea	2022-05-04 19:13:07.352	416	7	sick	2025-03-17 19:13:07.352	2025-05-04 19:13:07.386778
133	B2004	Vaca	Leiteira Holstein	fêmea	2023-05-04 19:13:07.415	390	7	treatment	2025-04-23 19:13:07.415	2025-05-04 19:13:07.447815
134	B2005	Vaca	Leiteira Holstein	macho	2023-05-04 19:13:07.475	316	7	pregnant	2025-02-07 19:13:07.475	2025-05-04 19:13:07.507583
135	B2006	Boi	Angus	fêmea	2021-05-04 19:13:07.535	686	7	treatment	2025-02-25 19:13:07.535	2025-05-04 19:13:07.569303
136	B2007	Vaca	Leiteira Holstein	fêmea	2020-05-04 19:13:07.599	464	7	treatment	2025-04-19 19:13:07.599	2025-05-04 19:13:07.63334
137	B2008	Vaca	Leiteira Holstein	fêmea	2020-05-04 19:13:07.66	240	7	treatment	2025-03-11 19:13:07.66	2025-05-04 19:13:07.693179
138	B2009	Vaca	Leiteira Holstein	fêmea	2020-05-04 19:13:07.721	668	7	healthy	2025-03-09 19:13:07.721	2025-05-04 19:13:07.753997
139	B2010	Boi	Angus	macho	2023-05-04 19:13:07.782	263	7	quarantine	2025-03-13 19:13:07.782	2025-05-04 19:13:07.817576
140	B2011	Vaca	Leiteira Holstein	macho	2021-05-04 19:13:07.844	377	7	quarantine	2025-02-12 19:13:07.845	2025-05-04 19:13:07.877159
141	B2012	Boi	Angus	fêmea	2024-05-04 19:13:07.908	225	7	pregnant	2025-04-21 19:13:07.908	2025-05-04 19:13:07.940971
142	B2013	Vaca	Leiteira Holstein	macho	2021-05-04 19:13:07.968	592	7	quarantine	2025-03-03 19:13:07.968	2025-05-04 19:13:08.001134
143	B2014	Boi	Angus	macho	2024-05-04 19:13:08.03	381	7	healthy	2025-03-26 19:13:08.03	2025-05-04 19:13:08.063777
144	B2015	Boi	Angus	macho	2023-05-04 19:13:08.093	487	7	quarantine	2025-04-02 19:13:08.093	2025-05-04 19:13:08.127356
145	B2016	Boi	Angus	fêmea	2020-05-04 19:13:08.154	512	7	treatment	2025-02-25 19:13:08.154	2025-05-04 19:13:08.189392
146	B2017	Boi	Angus	fêmea	2020-05-04 19:13:08.218	586	7	healthy	2025-04-20 19:13:08.218	2025-05-04 19:13:08.250749
147	B2018	Boi	Angus	macho	2020-05-04 19:13:08.278	211	7	healthy	2025-02-24 19:13:08.278	2025-05-04 19:13:08.312606
148	B2019	Boi	Angus	macho	2021-05-04 19:13:08.34	252	7	pregnant	2025-04-07 19:13:08.34	2025-05-04 19:13:08.373166
149	B2020	Boi	Angus	macho	2023-05-04 19:13:08.4	462	7	pregnant	2025-03-10 19:13:08.4	2025-05-04 19:13:08.433393
150	B2021	Boi	Angus	macho	2020-05-04 19:13:08.461	274	7	sick	2025-02-22 19:13:08.461	2025-05-04 19:13:08.501694
151	B2022	Boi	Angus	fêmea	2024-05-04 19:13:08.529	477	7	healthy	2025-03-20 19:13:08.529	2025-05-04 19:13:08.561359
152	B2023	Boi	Angus	fêmea	2021-05-04 19:13:08.59	673	7	pregnant	2025-02-22 19:13:08.59	2025-05-04 19:13:08.623623
153	B2024	Boi	Angus	fêmea	2022-05-04 19:13:08.651	318	7	pregnant	2025-02-19 19:13:08.651	2025-05-04 19:13:08.682897
154	B2025	Vaca	Leiteira Holstein	macho	2023-05-04 19:13:08.711	513	7	healthy	2025-02-17 19:13:08.711	2025-05-04 19:13:08.743675
155	B2026	Boi	Angus	fêmea	2023-05-04 19:13:08.771	295	7	healthy	2025-04-16 19:13:08.771	2025-05-04 19:13:08.807636
156	B2027	Boi	Angus	macho	2020-05-04 19:13:08.835	657	7	healthy	2025-02-07 19:13:08.835	2025-05-04 19:13:08.868059
157	B2028	Boi	Angus	fêmea	2024-05-04 19:13:08.896	239	7	healthy	2025-02-08 19:13:08.896	2025-05-04 19:13:08.932089
158	B2029	Vaca	Leiteira Holstein	fêmea	2022-05-04 19:13:08.96	699	7	pregnant	2025-04-15 19:13:08.96	2025-05-04 19:13:08.99285
159	B2030	Boi	Angus	macho	2022-05-04 19:13:09.02	568	7	pregnant	2025-03-19 19:13:09.02	2025-05-04 19:13:09.054592
160	B2031	Boi	Angus	fêmea	2024-05-04 19:13:09.082	250	7	healthy	2025-04-14 19:13:09.082	2025-05-04 19:13:09.114568
161	B2032	Boi	Angus	fêmea	2022-05-04 19:13:09.142	403	7	treatment	2025-02-08 19:13:09.142	2025-05-04 19:13:09.17537
162	B2033	Vaca	Leiteira Holstein	macho	2021-05-04 19:13:09.202	504	7	quarantine	2025-03-10 19:13:09.202	2025-05-04 19:13:09.235489
163	B2034	Vaca	Leiteira Holstein	fêmea	2021-05-04 19:13:09.262	395	7	pregnant	2025-03-19 19:13:09.262	2025-05-04 19:13:09.297514
164	B2035	Boi	Angus	fêmea	2021-05-04 19:13:09.325	434	7	sick	2025-03-21 19:13:09.325	2025-05-04 19:13:09.358079
165	B2036	Boi	Angus	macho	2024-05-04 19:13:09.385	498	7	healthy	2025-04-29 19:13:09.385	2025-05-04 19:13:09.418709
166	B2037	Vaca	Leiteira Holstein	macho	2023-05-04 19:13:09.448	292	7	healthy	2025-04-19 19:13:09.448	2025-05-04 19:13:09.480445
167	B2038	Boi	Angus	fêmea	2024-05-04 19:13:09.508	510	7	treatment	2025-02-11 19:13:09.508	2025-05-04 19:13:09.53968
168	B2039	Vaca	Leiteira Holstein	fêmea	2022-05-04 19:13:09.568	362	7	healthy	2025-02-06 19:13:09.568	2025-05-04 19:13:09.600863
169	B2040	Boi	Angus	fêmea	2024-05-04 19:13:09.628	483	7	healthy	2025-02-08 19:13:09.628	2025-05-04 19:13:09.660369
170	B2041	Boi	Angus	macho	2024-05-04 19:13:09.687	593	7	treatment	2025-04-11 19:13:09.687	2025-05-04 19:13:09.720359
171	B2042	Boi	Angus	fêmea	2024-05-04 19:13:09.747	584	7	treatment	2025-02-17 19:13:09.747	2025-05-04 19:13:09.780774
172	B2043	Boi	Angus	fêmea	2024-05-04 19:13:09.808	323	7	sick	2025-02-05 19:13:09.808	2025-05-04 19:13:09.839791
173	B2044	Vaca	Leiteira Holstein	fêmea	2023-05-04 19:13:09.867	340	7	quarantine	2025-04-08 19:13:09.867	2025-05-04 19:13:09.899882
174	B2045	Boi	Angus	fêmea	2024-05-04 19:13:09.927	362	7	healthy	2025-03-31 19:13:09.927	2025-05-04 19:13:09.960399
175	B2046	Boi	Angus	macho	2023-05-04 19:13:09.988	381	7	pregnant	2025-04-06 19:13:09.988	2025-05-04 19:13:10.022476
176	B2047	Boi	Angus	fêmea	2021-05-04 19:13:10.05	334	7	pregnant	2025-03-10 19:13:10.05	2025-05-04 19:13:10.087679
177	B2048	Boi	Angus	fêmea	2023-05-04 19:13:10.115	304	7	quarantine	2025-03-20 19:13:10.115	2025-05-04 19:13:10.147617
178	B2049	Boi	Angus	macho	2023-05-04 19:13:10.175	599	7	healthy	2025-02-16 19:13:10.175	2025-05-04 19:13:10.207601
179	P3000	Galinha	Orpington	fêmea	2024-12-04 19:13:10.235	2	10	sick	2025-04-14 19:13:10.235	2025-05-04 19:13:10.267609
180	P3001	Galinha	Plymouth Rock	macho	2025-03-04 19:13:10.295	1	10	healthy	2025-04-19 19:13:10.295	2025-05-04 19:13:10.328513
181	P3002	Galinha	Orpington	fêmea	2024-08-04 19:13:10.357	2	10	sick	2025-04-20 19:13:10.357	2025-05-04 19:13:10.389709
182	P3003	Galinha	Leghorn	fêmea	2025-05-04 19:13:10.417	3	10	quarantine	2025-04-27 19:13:10.417	2025-05-04 19:13:10.452313
183	P3004	Galinha	Ameraucana	fêmea	2025-01-04 19:13:10.482	1	10	healthy	2025-04-05 19:13:10.482	2025-05-04 19:13:10.514941
184	P3005	Galinha	Leghorn	fêmea	2024-08-04 19:13:10.542	2	10	quarantine	2025-04-15 19:13:10.542	2025-05-04 19:13:10.574772
185	P3006	Galinha	Plymouth Rock	fêmea	2024-07-04 19:13:10.602	3	10	healthy	2025-04-24 19:13:10.602	2025-05-04 19:13:10.636256
186	P3007	Galinha	Plymouth Rock	macho	2025-04-04 19:13:10.664	3	10	sick	2025-05-01 19:13:10.665	2025-05-04 19:13:10.697961
187	P3008	Galinha	Plymouth Rock	macho	2024-09-04 19:13:10.726	1	10	quarantine	2025-04-06 19:13:10.726	2025-05-04 19:13:10.759804
188	P3009	Galinha	Orpington	fêmea	2024-08-04 19:13:10.791	2	10	healthy	2025-04-14 19:13:10.791	2025-05-04 19:13:10.823596
189	P3010	Galinha	Plymouth Rock	macho	2025-03-04 19:13:10.851	3	10	healthy	2025-04-19 19:13:10.851	2025-05-04 19:13:10.886094
190	A1000	Galinha	Raça de Galinha	fêmea	2021-05-04 19:13:38.141	149	6	healthy	2025-03-22 19:13:38.141	2025-05-04 19:13:40.431095
191	A1001	Galinha	Raça de Galinha	macho	2021-05-04 19:13:40.459	192	6	sick	2025-03-26 19:13:40.459	2025-05-04 19:13:40.491444
192	A1002	Cabra	Raça de Cabra	fêmea	2020-05-04 19:13:40.518	364	6	quarantine	2025-04-02 19:13:40.518	2025-05-04 19:13:40.551357
193	A1003	Ovelha	Raça de Ovelha	macho	2023-05-04 19:13:40.578	232	6	healthy	2025-04-06 19:13:40.578	2025-05-04 19:13:40.610934
194	A1004	Vaca	Raça de Vaca	fêmea	2021-05-04 19:13:40.637	57	6	pregnant	2025-04-17 19:13:40.637	2025-05-04 19:13:40.670064
195	A1005	Vaca	Raça de Vaca	fêmea	2021-05-04 19:13:40.696	149	6	pregnant	2025-02-06 19:13:40.697	2025-05-04 19:13:40.729528
196	A1006	Boi	Raça de Boi	macho	2021-05-04 19:13:40.756	424	6	treatment	2025-02-26 19:13:40.756	2025-05-04 19:13:40.78905
197	A1007	Galinha	Raça de Galinha	macho	2021-05-04 19:13:40.815	510	6	pregnant	2025-02-21 19:13:40.815	2025-05-04 19:13:40.848068
198	A1008	Galinha	Raça de Galinha	fêmea	2023-05-04 19:13:40.874	376	6	treatment	2025-03-20 19:13:40.874	2025-05-04 19:13:40.90636
199	A1009	Cabra	Raça de Cabra	fêmea	2020-05-04 19:13:40.933	482	6	sick	2025-03-12 19:13:40.933	2025-05-04 19:13:40.966357
200	A1010	Cabra	Raça de Cabra	macho	2020-05-04 19:13:40.993	173	6	healthy	2025-02-07 19:13:40.993	2025-05-04 19:13:41.025536
201	A1011	Ovelha	Raça de Ovelha	macho	2022-05-04 19:13:41.052	314	6	quarantine	2025-04-06 19:13:41.052	2025-05-04 19:13:41.083583
202	A1012	Boi	Raça de Boi	fêmea	2022-05-04 19:13:41.11	495	6	healthy	2025-03-26 19:13:41.111	2025-05-04 19:13:41.143686
203	A1013	Boi	Raça de Boi	fêmea	2022-05-04 19:13:41.17	360	6	healthy	2025-04-08 19:13:41.17	2025-05-04 19:13:41.202846
204	A1014	Galinha	Raça de Galinha	macho	2022-05-04 19:13:41.229	200	6	treatment	2025-03-11 19:13:41.229	2025-05-04 19:13:41.262074
205	A1015	Boi	Raça de Boi	macho	2024-05-04 19:13:41.288	423	6	healthy	2025-03-28 19:13:41.288	2025-05-04 19:13:41.321376
206	A1016	Ovelha	Raça de Ovelha	fêmea	2021-05-04 19:13:41.348	447	6	healthy	2025-03-23 19:13:41.348	2025-05-04 19:13:41.380547
207	A1017	Vaca	Raça de Vaca	fêmea	2023-05-04 19:13:41.407	176	6	healthy	2025-03-10 19:13:41.407	2025-05-04 19:13:41.439674
208	A1018	Cabra	Raça de Cabra	fêmea	2021-05-04 19:13:41.466	251	6	treatment	2025-02-17 19:13:41.466	2025-05-04 19:13:41.499152
209	A1019	Boi	Raça de Boi	macho	2021-05-04 19:13:41.525	474	6	healthy	2025-02-21 19:13:41.526	2025-05-04 19:13:41.557415
210	A1020	Galinha	Raça de Galinha	macho	2020-05-04 19:13:41.584	431	6	treatment	2025-03-23 19:13:41.584	2025-05-04 19:13:41.615443
211	A1021	Ovelha	Raça de Ovelha	fêmea	2022-05-04 19:13:41.642	328	6	treatment	2025-05-01 19:13:41.642	2025-05-04 19:13:41.674483
212	A1022	Boi	Raça de Boi	macho	2024-05-04 19:13:41.701	502	6	sick	2025-05-04 19:13:41.701	2025-05-04 19:13:41.733252
213	A1023	Galinha	Raça de Galinha	macho	2022-05-04 19:13:41.76	526	6	sick	2025-03-13 19:13:41.76	2025-05-04 19:13:41.792348
214	A1024	Boi	Raça de Boi	fêmea	2021-05-04 19:13:41.818	58	6	sick	2025-02-20 19:13:41.818	2025-05-04 19:13:41.85095
215	B2000	Boi	Angus	macho	2021-05-04 19:13:41.877	529	7	healthy	2025-04-26 19:13:41.877	2025-05-04 19:13:41.909671
216	B2001	Vaca	Leiteira Holstein	fêmea	2020-05-04 19:13:41.937	475	7	healthy	2025-02-27 19:13:41.937	2025-05-04 19:13:41.973652
217	B2002	Boi	Angus	macho	2022-05-04 19:13:42.001	234	7	quarantine	2025-03-08 19:13:42.001	2025-05-04 19:13:42.032646
218	B2003	Boi	Angus	fêmea	2024-05-04 19:13:42.059	681	7	healthy	2025-03-26 19:13:42.059	2025-05-04 19:13:42.094389
219	B2004	Vaca	Leiteira Holstein	fêmea	2021-05-04 19:13:42.12	333	7	pregnant	2025-03-24 19:13:42.12	2025-05-04 19:13:42.152917
220	B2005	Vaca	Leiteira Holstein	fêmea	2021-05-04 19:13:42.179	610	7	pregnant	2025-02-19 19:13:42.179	2025-05-04 19:13:42.211827
221	B2006	Boi	Angus	fêmea	2022-05-04 19:13:42.238	499	7	healthy	2025-03-09 19:13:42.238	2025-05-04 19:13:42.270605
222	B2007	Boi	Angus	macho	2022-05-04 19:13:42.297	426	7	healthy	2025-03-20 19:13:42.297	2025-05-04 19:13:42.329286
223	B2008	Boi	Angus	fêmea	2021-05-04 19:13:42.355	423	7	healthy	2025-03-11 19:13:42.355	2025-05-04 19:13:42.387904
224	B2009	Boi	Angus	fêmea	2020-05-04 19:13:42.414	454	7	treatment	2025-04-07 19:13:42.414	2025-05-04 19:13:42.446631
225	B2010	Boi	Angus	macho	2020-05-04 19:13:42.473	485	7	pregnant	2025-03-19 19:13:42.473	2025-05-04 19:13:42.505246
226	B2011	Boi	Angus	fêmea	2024-05-04 19:13:42.531	392	7	sick	2025-04-15 19:13:42.531	2025-05-04 19:13:42.563823
227	B2012	Vaca	Leiteira Holstein	fêmea	2024-05-04 19:13:42.59	452	7	pregnant	2025-04-04 19:13:42.59	2025-05-04 19:13:42.624115
228	B2013	Vaca	Leiteira Holstein	fêmea	2021-05-04 19:13:42.651	580	7	quarantine	2025-03-25 19:13:42.651	2025-05-04 19:13:42.683439
229	B2014	Boi	Angus	fêmea	2022-05-04 19:13:42.71	285	7	quarantine	2025-04-22 19:13:42.71	2025-05-04 19:13:42.742089
230	B2015	Vaca	Leiteira Holstein	fêmea	2020-05-04 19:13:42.768	341	7	quarantine	2025-04-02 19:13:42.768	2025-05-04 19:13:42.800832
231	B2016	Boi	Angus	macho	2023-05-04 19:13:42.827	543	7	treatment	2025-02-10 19:13:42.827	2025-05-04 19:13:42.859563
232	B2017	Vaca	Leiteira Holstein	macho	2020-05-04 19:13:42.886	385	7	sick	2025-02-19 19:13:42.886	2025-05-04 19:13:42.920146
233	B2018	Boi	Angus	macho	2024-05-04 19:13:42.946	331	7	pregnant	2025-03-21 19:13:42.946	2025-05-04 19:13:42.978874
234	B2019	Vaca	Leiteira Holstein	macho	2022-05-04 19:13:43.005	214	7	treatment	2025-02-19 19:13:43.005	2025-05-04 19:13:43.036319
235	B2020	Boi	Angus	fêmea	2022-05-04 19:13:43.062	470	7	pregnant	2025-03-27 19:13:43.062	2025-05-04 19:13:43.094846
236	B2021	Vaca	Leiteira Holstein	fêmea	2020-05-04 19:13:43.121	296	7	quarantine	2025-03-17 19:13:43.121	2025-05-04 19:13:43.156355
237	B2022	Boi	Angus	macho	2023-05-04 19:13:43.183	609	7	treatment	2025-04-11 19:13:43.183	2025-05-04 19:13:43.215393
238	B2023	Vaca	Leiteira Holstein	fêmea	2022-05-04 19:13:43.241	259	7	sick	2025-02-26 19:13:43.241	2025-05-04 19:13:43.278702
239	B2024	Vaca	Leiteira Holstein	fêmea	2022-05-04 19:13:43.309	462	7	sick	2025-02-20 19:13:43.309	2025-05-04 19:13:43.341385
240	P3000	Galinha	Rhode Island Red	fêmea	2025-05-04 19:13:43.367	3	10	sick	2025-04-26 19:13:43.367	2025-05-04 19:13:43.399939
241	P3001	Galinha	Plymouth Rock	fêmea	2024-11-04 19:13:43.426	3	10	sick	2025-04-13 19:13:43.426	2025-05-04 19:13:43.458698
242	P3002	Galinha	Orpington	macho	2024-08-04 19:13:43.485	3	10	sick	2025-04-16 19:13:43.485	2025-05-04 19:13:43.517621
243	P3003	Galinha	Ameraucana	macho	2025-04-04 19:13:43.544	1	10	sick	2025-04-16 19:13:43.544	2025-05-04 19:13:43.576218
244	P3004	Galinha	Ameraucana	macho	2024-10-04 19:13:43.602	3	10	sick	2025-04-23 19:13:43.602	2025-05-04 19:13:43.642078
245	P3005	Galinha	Ameraucana	macho	2024-10-04 19:13:43.669	3	10	healthy	2025-05-04 19:13:43.669	2025-05-04 19:13:43.701657
246	P3006	Galinha	Rhode Island Red	macho	2025-04-04 19:13:43.728	2	10	healthy	2025-04-17 19:13:43.728	2025-05-04 19:13:43.761556
247	P3007	Galinha	Orpington	fêmea	2025-02-04 19:13:43.788	1	10	quarantine	2025-04-24 19:13:43.788	2025-05-04 19:13:43.820315
248	P3008	Galinha	Ameraucana	fêmea	2024-06-04 19:13:43.846	1	10	quarantine	2025-04-13 19:13:43.846	2025-05-04 19:13:43.878883
249	P3009	Galinha	Rhode Island Red	macho	2025-04-04 19:13:43.905	3	10	quarantine	2025-04-23 19:13:43.905	2025-05-04 19:13:43.93788
250	P3010	Galinha	Ameraucana	macho	2025-01-04 19:13:43.964	3	10	quarantine	2025-04-29 19:13:43.964	2025-05-04 19:13:43.996455
251	P3011	Galinha	Rhode Island Red	macho	2024-06-04 19:13:44.023	3	10	sick	2025-05-04 19:13:44.023	2025-05-04 19:13:44.054902
252	P3012	Galinha	Ameraucana	macho	2025-01-04 19:13:44.081	1	10	healthy	2025-05-02 19:13:44.081	2025-05-04 19:13:44.113623
253	P3013	Galinha	Leghorn	macho	2024-08-04 19:13:44.14	1	10	healthy	2025-04-23 19:13:44.14	2025-05-04 19:13:44.171296
254	P3014	Galinha	Orpington	fêmea	2024-10-04 19:13:44.197	3	10	healthy	2025-05-01 19:13:44.197	2025-05-04 19:13:44.229805
255	P3015	Galinha	Leghorn	fêmea	2025-02-04 19:13:44.256	1	10	quarantine	2025-04-13 19:13:44.256	2025-05-04 19:13:44.288569
256	P3016	Galinha	Plymouth Rock	fêmea	2024-11-04 19:13:44.315	1	10	healthy	2025-04-19 19:13:44.315	2025-05-04 19:13:44.3473
257	P3017	Galinha	Orpington	fêmea	2024-08-04 19:13:44.375	3	10	quarantine	2025-04-10 19:13:44.375	2025-05-04 19:13:44.407252
258	P3018	Galinha	Orpington	fêmea	2025-01-04 19:13:44.435	1	10	healthy	2025-04-17 19:13:44.435	2025-05-04 19:13:44.467524
259	P3019	Galinha	Orpington	macho	2024-09-04 19:13:44.494	1	10	quarantine	2025-04-13 19:13:44.494	2025-05-04 19:13:44.526055
\.


--
-- Data for Name: crops; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.crops (id, name, sector, area, planting_date, expected_harvest_date, status, farm_id, created_at) FROM stdin;
2	Milho	Setor A	49	2025-01-09 19:14:30.348	2025-04-22 19:14:30.348	ready	6	2025-05-04 19:14:30.636806
3	Milho	Setor B	45	2025-03-21 19:14:30.68	2025-07-13 19:14:30.68	harvested	6	2025-05-04 19:14:30.71266
4	Batata	Setor C	38	2025-03-24 19:14:30.741	2025-06-24 19:14:30.741	ready	6	2025-05-04 19:14:30.779087
5	Milho	Setor D	44	2025-03-27 19:14:30.807	2025-07-12 19:14:30.807	ready	6	2025-05-04 19:14:30.845039
6	Cana-de-açúcar	Setor E	14	2025-01-28 19:14:30.878	2025-05-18 19:14:30.878	growing	6	2025-05-04 19:14:30.912861
7	Cana-de-açúcar	Setor A	44	2025-01-24 19:14:30.94	2025-05-06 19:14:30.94	ready	6	2025-05-04 19:14:30.973039
8	Batata	Setor B	46	2025-02-18 19:14:31	2025-05-26 19:14:31	planting	6	2025-05-04 19:14:31.036581
9	Cana-de-açúcar	Setor C	56	2025-05-04 19:14:31.064	2025-08-25 19:14:31.064	planting	6	2025-05-04 19:14:31.096658
10	Mandioca	Setor D	29	2025-02-09 19:14:31.123	2025-05-24 19:14:31.123	planting	6	2025-05-04 19:14:31.155904
11	Cana-de-açúcar	Setor E	47	2025-04-01 19:14:31.182	2025-07-08 19:14:31.182	growing	6	2025-05-04 19:14:31.218273
12	Algodão	Setor A	113	2025-05-03 19:14:31.247	2025-08-01 19:14:31.247	ready	8	2025-05-04 19:14:31.281015
13	Arroz	Setor B	107	2025-02-07 19:14:31.309	2025-05-26 19:14:31.309	planting	8	2025-05-04 19:14:31.34268
14	Arroz	Setor C	104	2025-02-26 19:14:31.431	2025-06-14 19:14:31.431	ready	8	2025-05-04 19:14:31.465243
15	Algodão	Setor D	61	2025-05-01 19:14:31.492	2025-08-08 19:14:31.492	ready	8	2025-05-04 19:14:31.530996
16	Café	Setor E	131	2025-03-14 19:14:31.562	2025-06-20 19:14:31.562	ready	8	2025-05-04 19:14:31.595969
17	Café	Setor F	132	2025-01-25 19:14:31.624	2025-05-22 19:14:31.624	harvested	8	2025-05-04 19:14:31.656405
18	Café	Setor G	57	2025-01-27 19:14:31.683	2025-05-15 19:14:31.683	growing	8	2025-05-04 19:14:31.738883
19	Soja	Setor H	56	2025-04-03 19:14:31.77	2025-07-05 19:14:31.77	growing	8	2025-05-04 19:14:31.802585
20	Algodão	Setor A	144	2025-01-19 19:14:31.829	2025-04-22 19:14:31.829	harvested	8	2025-05-04 19:14:31.862341
21	Algodão	Setor B	69	2025-01-19 19:14:31.889	2025-04-21 19:14:31.889	growing	8	2025-05-04 19:14:31.926297
22	Amendoim	Setor C	134	2025-02-09 19:14:31.953	2025-05-18 19:14:31.953	planting	8	2025-05-04 19:14:31.995274
23	Amendoim	Setor D	90	2025-01-25 19:14:32.031	2025-05-16 19:14:32.031	planting	8	2025-05-04 19:14:32.064033
24	Café	Setor E	72	2025-01-22 19:14:32.092	2025-05-08 19:14:32.092	ready	8	2025-05-04 19:14:32.124099
25	Café	Setor F	104	2025-03-19 19:14:32.151	2025-07-10 19:14:32.151	ready	8	2025-05-04 19:14:32.187105
26	Algodão	Setor G	101	2025-01-31 19:14:32.214	2025-05-12 19:14:32.214	planting	8	2025-05-04 19:14:32.248412
27	Manga	Setor A	48	2025-04-08 19:14:32.276	2025-11-03 19:14:32.276	planting	9	2025-05-04 19:14:32.308227
28	Abacaxi	Setor B	39	2025-05-02 19:14:32.335	2025-12-16 19:14:32.335	planting	9	2025-05-04 19:14:32.369526
29	Banana	Setor C	31	2025-03-19 19:14:32.397	2025-11-17 19:14:32.397	growing	9	2025-05-04 19:14:32.428696
30	Goiaba	Setor D	33	2024-07-21 19:14:32.456	2025-04-11 19:14:32.456	ready	9	2025-05-04 19:14:32.506976
31	Papaia	Setor E	48	2024-07-02 19:14:32.545	2025-02-11 19:14:32.545	harvested	9	2025-05-04 19:14:32.579955
32	Maracujá	Setor F	24	2024-06-26 19:14:32.608	2024-12-25 19:14:32.608	harvested	9	2025-05-04 19:14:32.64244
33	Coco	Setor G	34	2024-10-09 19:14:32.67	2025-05-23 19:14:32.67	planting	9	2025-05-04 19:14:32.703771
\.


--
-- Data for Name: farms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.farms (id, name, location, size, created_by, admin_id, description, coordinates, type, created_at) FROM stdin;
6	Fazenda Modelo	Luanda, Angola	1000	10	11	Uma fazenda modelo para demonstração do sistema	-8.8368,13.2343	mixed	2025-05-04 19:10:20.943674
7	Fazenda Pecuária do Sul	Huambo, Angola	2500	10	11	Fazenda de criação de gado no sul de Angola	-12.7761,15.7385	livestock	2025-05-04 19:10:21.005855
8	Fazenda Agrícola do Norte	Uíge, Angola	1500	10	11	Fazenda de plantações no norte de Angola	-7.6087,15.0613	crop	2025-05-04 19:10:21.066821
9	Pomar Tropical	Benguela, Angola	350	10	11	Fazenda especializada na produção de frutas tropicais	-12.5763,13.4055	crop	2025-05-04 19:10:21.130104
10	Granja Aviária	Lubango, Angola	200	10	11	Granja dedicada à criação de aves	-14.9195,13.5326	livestock	2025-05-04 19:10:21.190499
11	Fazenda Modelo	Luanda, Angola	1000	17	18	Fazenda principal para testes do sistema	-8.8368,13.2343	mixed	2025-05-05 08:33:50.909642
12	Fazenda Modelo	Luanda, Angola	1000	18	18	Fazenda principal para testes	-8.8368,13.2343	mixed	2025-05-05 08:35:01.1958
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goals (id, name, description, assigned_to, start_date, end_date, crop_id, target_value, actual_value, unit, status, completion_date, farm_id, created_by, notes, created_at) FROM stdin;
1	Plantio de Milho	Plantar 10 hectares de milho na área sul	20	2025-05-05 08:36:38.722027	2025-08-05 08:36:38.722027	\N	10	0	hectares	pending	\N	12	18	\N	2025-05-05 08:36:38.722027
2	Colheita de Café	Colher 500kg de café na área leste	20	2025-05-05 08:36:38.722027	2025-07-05 08:36:38.722027	\N	500	0	kilograms	pending	\N	12	18	\N	2025-05-05 08:36:38.722027
3	Manutenção de Cercas	Reparar 200 metros de cercas no perímetro	19	2025-05-05 08:36:38.722027	2025-06-05 08:36:38.722027	\N	200	0	meters	in_progress	\N	12	18	\N	2025-05-05 08:36:38.722027
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory (id, name, category, quantity, unit, farm_id, minimum_level, created_at) FROM stdin;
5	Ração animal	tools	742	l	6	148	2025-05-04 19:15:05.915266
6	Vacina geral	fertilizer	613	boxes	6	122	2025-05-04 19:15:05.99178
7	Sementes de milho	tools	194	bags	6	38	2025-05-04 19:15:06.059538
8	Fertilizante NPK	medicine	53	l	6	10	2025-05-04 19:15:06.1247
9	Ferramentas manuais	fertilizer	752	bags	6	150	2025-05-04 19:15:06.18881
10	Antibiótico	equipment	517	l	6	103	2025-05-04 19:15:06.257928
11	Sementes de feijão	feed	512	units	6	102	2025-05-04 19:15:06.337194
12	Pesticida	seeds	579	bags	6	115	2025-05-04 19:15:06.399547
13	Equipamento de irrigação	feed	568	l	6	113	2025-05-04 19:15:06.466174
14	Suplemento alimentar	feed	501	bags	6	100	2025-05-04 19:15:06.534411
15	Remédio para parasitas	medicine	5	boxes	6	10	2025-05-04 19:15:06.604729
16	Semente de alta produtividade	seeds	8	bags	6	15	2025-05-04 19:15:06.666366
17	Ração bovina	medicine	943	bags	7	141	2025-05-04 19:15:06.732774
18	Vacina contra febre aftosa	feed	267	units	7	40	2025-05-04 19:15:06.801708
19	Suplemento mineral	feed	166	units	7	24	2025-05-04 19:15:06.865071
20	Medicamento antibiótico	seeds	60	l	7	9	2025-05-04 19:15:06.925669
21	Equipamento de ordenha	medicine	184	bags	7	27	2025-05-04 19:15:06.991345
22	Sal mineral	seeds	706	units	7	105	2025-05-04 19:15:07.058525
23	Vermífugo	medicine	187	kg	7	28	2025-05-04 19:15:07.125917
24	Semente de café	equipment	394	units	8	39	2025-05-04 19:15:07.185865
25	Fertilizante orgânico	fertilizer	163	l	8	16	2025-05-04 19:15:07.250123
26	Fertilizante químico	seeds	737	units	8	73	2025-05-04 19:15:07.317465
27	Inseticida natural	tools	388	boxes	8	38	2025-05-04 19:15:07.386287
28	Herbicida	equipment	1008	boxes	8	100	2025-05-04 19:15:07.447767
29	Equipamento de irrigação	fertilizer	489	bags	8	48	2025-05-04 19:15:07.506949
30	Ferramentas de colheita	tools	305	l	8	30	2025-05-04 19:15:07.566222
31	Semente de algodão	equipment	75	boxes	8	7	2025-05-04 19:15:07.625652
32	Adubo para frutíferas	tools	526	l	9	105	2025-05-04 19:15:07.685486
33	Inseticida orgânico	fertilizer	135	l	9	27	2025-05-04 19:15:07.746415
34	Kit de poda	fertilizer	323	l	9	64	2025-05-04 19:15:07.80622
35	Sistema de irrigação por gotejamento	equipment	493	bags	9	98	2025-05-04 19:15:07.86644
36	Ferramentas de colheita	tools	355	kg	9	71	2025-05-04 19:15:07.92767
37	Caixas para frutas	equipment	356	kg	9	71	2025-05-04 19:15:07.986608
38	Fertilizante foliar	equipment	385	bags	9	77	2025-05-04 19:15:08.04602
39	Ração para aves	medicine	151	units	10	37	2025-05-04 19:15:08.107443
40	Vacina para Newcastle	seeds	467	bags	10	116	2025-05-04 19:15:08.165533
41	Medicamento antibiótico	fertilizer	219	l	10	54	2025-05-04 19:15:08.225098
42	Vitamina para aves	medicine	385	kg	10	96	2025-05-04 19:15:08.284295
43	Bebedouros	feed	486	l	10	121	2025-05-04 19:15:08.342307
44	Comedouros	medicine	99	units	10	24	2025-05-04 19:15:08.405581
45	Equipamento de iluminação	fertilizer	375	units	10	93	2025-05-04 19:15:08.4644
46	Desinfetante	fertilizer	354	l	10	88	2025-05-04 19:15:08.524377
47	SEMENTES	equipment	10	kg	6	2	2025-05-05 03:23:50.380809
48	sementes	seeds	10	kg	6	10	2025-05-05 04:41:28.479771
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tasks (id, title, description, due_date, status, priority, assigned_to, category, related_id, farm_id, created_at) FROM stdin;
2	Vacinação dos animais	Detalhes para a tarefa: Vacinação dos animais	2025-04-27 19:15:56.917	pending	low	\N	crop	\N	6	2025-05-04 19:15:57.198218
3	Alimentação do gado	Detalhes para a tarefa: Alimentação do gado	2025-05-02 19:15:56.917	canceled	high	12	general	\N	6	2025-05-04 19:15:57.270298
4	Plantio de milho	Detalhes para a tarefa: Plantio de milho	2025-04-25 19:15:56.917	completed	low	15	general	\N	6	2025-05-04 19:15:57.331659
5	Fertilização do setor A	Detalhes para a tarefa: Fertilização do setor A	2025-05-09 19:15:56.917	canceled	high	12	general	\N	6	2025-05-04 19:15:57.391004
6	Contagem de inventário	Detalhes para a tarefa: Contagem de inventário	2025-05-06 19:15:56.917	canceled	medium	\N	crop	\N	6	2025-05-04 19:15:57.449938
7	Manutenção de equipamentos	Detalhes para a tarefa: Manutenção de equipamentos	2025-04-29 19:15:56.917	completed	high	15	animal	\N	6	2025-05-04 19:15:57.509272
8	Colheita de feijão	Detalhes para a tarefa: Colheita de feijão	2025-05-14 19:15:56.917	in_progress	medium	\N	crop	\N	6	2025-05-04 19:15:57.569975
9	Limpeza dos estábulos	Detalhes para a tarefa: Limpeza dos estábulos	2025-05-08 19:15:56.917	canceled	medium	\N	inventory	\N	6	2025-05-04 19:15:57.631776
10	Monitoramento de pragas	Detalhes para a tarefa: Monitoramento de pragas	2025-04-28 19:15:56.917	completed	low	15	animal	\N	6	2025-05-04 19:15:57.693878
11	Reparo da cerca norte	Detalhes para a tarefa: Reparo da cerca norte	2025-04-29 19:15:56.917	canceled	low	15	inventory	\N	6	2025-05-04 19:15:57.754829
12	Vacinação anual	Tarefa relacionada à pecuária: Vacinação anual	2025-05-08 19:15:56.917	pending	low	12	animal	\N	7	2025-05-04 19:15:57.816965
13	Rotação de pasto	Tarefa relacionada à pecuária: Rotação de pasto	2025-05-08 19:15:56.917	pending	medium	12	animal	\N	7	2025-05-04 19:15:57.879569
14	Verificação de cercas	Tarefa relacionada à pecuária: Verificação de cercas	2025-05-24 19:15:56.917	pending	medium	\N	animal	\N	7	2025-05-04 19:15:57.939975
15	Manutenção do curral	Tarefa relacionada à pecuária: Manutenção do curral	2025-05-10 19:15:56.917	in_progress	low	13	animal	\N	7	2025-05-04 19:15:57.99993
16	Compra de suplementos	Tarefa relacionada à pecuária: Compra de suplementos	2025-05-19 19:15:56.917	pending	medium	12	animal	\N	7	2025-05-04 19:15:58.058372
17	Exame de saúde animal	Tarefa relacionada à pecuária: Exame de saúde animal	2025-05-15 19:15:56.917	canceled	medium	12	animal	\N	7	2025-05-04 19:15:58.117435
18	Treinamento de funcionários	Tarefa relacionada à pecuária: Treinamento de funcionários	2025-05-19 19:15:56.917	canceled	medium	13	animal	\N	7	2025-05-04 19:15:58.174935
19	Instalação de comedouros	Tarefa relacionada à pecuária: Instalação de comedouros	2025-05-01 19:15:56.917	canceled	high	12	animal	\N	7	2025-05-04 19:15:58.23628
20	Preparação do solo	Tarefa relacionada às plantações: Preparação do solo	2025-05-03 19:15:56.917	completed	low	\N	crop	\N	8	2025-05-04 19:15:58.29576
21	Aplicação de pesticidas	Tarefa relacionada às plantações: Aplicação de pesticidas	2025-05-06 19:15:56.917	canceled	low	15	crop	\N	8	2025-05-04 19:15:58.357048
22	Irrigação	Tarefa relacionada às plantações: Irrigação	2025-05-28 19:15:56.917	completed	low	14	crop	\N	8	2025-05-04 19:15:58.420003
23	Colheita de arroz	Tarefa relacionada às plantações: Colheita de arroz	2025-05-17 19:15:56.917	in_progress	high	14	crop	\N	8	2025-05-04 19:15:58.479527
24	Controle de plantas daninhas	Tarefa relacionada às plantações: Controle de plantas daninhas	2025-04-29 19:15:56.917	canceled	medium	15	crop	\N	8	2025-05-04 19:15:58.555901
25	Análise de solo	Tarefa relacionada às plantações: Análise de solo	2025-04-27 19:15:56.917	pending	high	14	crop	\N	8	2025-05-04 19:15:58.616077
26	Compra de sementes	Tarefa relacionada às plantações: Compra de sementes	2025-05-17 19:15:56.917	in_progress	low	\N	crop	\N	8	2025-05-04 19:15:58.674948
27	Avaliação de crescimento	Tarefa relacionada às plantações: Avaliação de crescimento	2025-05-26 19:15:56.917	canceled	low	14	crop	\N	8	2025-05-04 19:15:58.736149
28	Podas de formação	Tarefa para o pomar: Podas de formação	2025-05-05 19:15:56.917	pending	high	14	crop	\N	9	2025-05-04 19:15:58.794122
29	Aplicação de fertilizantes	Tarefa para o pomar: Aplicação de fertilizantes	2025-05-20 19:15:56.917	pending	low	16	crop	\N	9	2025-05-04 19:15:58.854687
30	Controle de insetos	Tarefa para o pomar: Controle de insetos	2025-05-08 19:15:56.917	pending	low	16	crop	\N	9	2025-05-04 19:15:58.919487
31	Colheita de manga	Tarefa para o pomar: Colheita de manga	2025-05-04 19:15:56.917	completed	low	\N	crop	\N	9	2025-05-04 19:15:58.983917
32	Análise de frutos	Tarefa para o pomar: Análise de frutos	2025-05-11 19:15:56.917	in_progress	low	14	crop	\N	9	2025-05-04 19:15:59.05115
33	Instalação de sistema de irrigação	Tarefa para o pomar: Instalação de sistema de irrigação	2025-05-11 19:15:56.917	canceled	high	14	crop	\N	9	2025-05-04 19:15:59.115044
34	Plantio de novas mudas	Tarefa para o pomar: Plantio de novas mudas	2025-05-17 19:15:56.917	completed	medium	\N	crop	\N	9	2025-05-04 19:15:59.177004
35	Avaliação de qualidade dos frutos	Tarefa para o pomar: Avaliação de qualidade dos frutos	2025-05-07 19:15:56.917	pending	high	14	crop	\N	9	2025-05-04 19:15:59.235728
36	Limpeza dos galpões	Tarefa para a granja: Limpeza dos galpões	2025-05-04 19:15:56.917	pending	low	12	animal	\N	10	2025-05-04 19:15:59.294723
37	Vacinação das aves	Tarefa para a granja: Vacinação das aves	2025-05-04 19:15:56.917	pending	medium	12	animal	\N	10	2025-05-04 19:15:59.355043
38	Verificação de bebedouros	Tarefa para a granja: Verificação de bebedouros	2025-05-04 19:15:56.917	pending	medium	12	animal	\N	10	2025-05-04 19:15:59.421019
39	Controle de temperatura	Tarefa para a granja: Controle de temperatura	2025-05-11 19:15:56.917	pending	medium	12	animal	\N	10	2025-05-04 19:15:59.483081
40	Coleta de ovos	Tarefa para a granja: Coleta de ovos	2025-05-10 19:15:56.917	in_progress	high	13	animal	\N	10	2025-05-04 19:15:59.577172
41	Monitoramento sanitário	Tarefa para a granja: Monitoramento sanitário	2025-05-06 19:15:56.917	in_progress	medium	12	animal	\N	10	2025-05-04 19:15:59.641603
42	Manutenção de equipamentos	Tarefa para a granja: Manutenção de equipamentos	2025-05-04 19:15:56.917	completed	medium	12	animal	\N	10	2025-05-04 19:15:59.702761
43	Separação de aves para venda	Tarefa para a granja: Separação de aves para venda	2025-05-07 19:15:56.917	completed	low	13	animal	\N	10	2025-05-04 19:15:59.761346
44	Reunião de equipe	Tarefa urgente: Reunião de equipe	2025-05-04 19:15:56.917	pending	high	11	general	\N	6	2025-05-04 19:15:59.821779
45	Entrega de relatório mensal	Tarefa urgente: Entrega de relatório mensal	2025-05-05 19:15:56.917	pending	high	12	general	\N	7	2025-05-04 19:15:59.884597
46	Manutenção emergencial	Tarefa urgente: Manutenção emergencial	2025-05-04 19:15:56.917	pending	high	13	general	\N	8	2025-05-04 19:15:59.951069
47	Inspeção de qualidade	Tarefa urgente: Inspeção de qualidade	2025-05-05 19:15:56.917	pending	high	14	general	\N	9	2025-05-04 19:16:00.014253
48	Visita técnica	Tarefa urgente: Visita técnica	2025-05-04 19:15:56.917	pending	high	15	general	\N	10	2025-05-04 19:16:00.076683
49	Pagamento de fornecedores	Tarefa urgente: Pagamento de fornecedores	2025-05-05 19:15:56.917	pending	high	16	general	\N	6	2025-05-04 19:16:00.141465
\.


--
-- Data for Name: user_farms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_farms (id, user_id, farm_id, role, created_at) FROM stdin;
10	11	6	admin	2025-05-04 19:10:21.251084
11	12	6	worker	2025-05-04 19:10:21.318277
12	13	6	specialist	2025-05-04 19:10:21.382079
13	14	6	specialist	2025-05-04 19:10:21.443434
14	15	6	manager	2025-05-04 19:10:21.503138
15	11	7	admin	2025-05-04 19:10:21.567396
16	13	7	specialist	2025-05-04 19:10:21.639063
17	12	7	worker	2025-05-04 19:10:21.707178
18	11	8	admin	2025-05-04 19:10:21.771853
19	14	8	specialist	2025-05-04 19:10:21.831156
20	15	8	manager	2025-05-04 19:10:21.891372
21	11	9	admin	2025-05-04 19:10:21.951205
22	14	9	specialist	2025-05-04 19:10:22.010812
23	16	9	consultant	2025-05-04 19:10:22.07141
24	11	10	admin	2025-05-04 19:10:22.140884
25	13	10	specialist	2025-05-04 19:10:22.211224
26	12	10	worker	2025-05-04 19:10:22.273072
27	18	11	admin	2025-05-05 08:33:50.986288
28	19	11	manager	2025-05-05 08:33:51.052023
29	20	11	worker	2025-05-05 08:33:51.112406
30	18	12	admin	2025-05-05 08:35:05.897183
31	19	12	manager	2025-05-05 08:35:17.012125
32	20	12	worker	2025-05-05 08:35:29.594644
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_permissions (id, user_id, farm_id, module, access_level, created_at) FROM stdin;
18	11	6	animals	full	2025-05-04 19:10:22.33239
19	11	6	crops	full	2025-05-04 19:10:22.394809
20	11	6	inventory	full	2025-05-04 19:10:22.471419
21	11	6	tasks	full	2025-05-04 19:10:22.535021
22	11	6	employees	full	2025-05-04 19:10:22.595152
23	11	6	financial	full	2025-05-04 19:10:22.653562
24	11	6	reports	full	2025-05-04 19:10:22.714717
25	12	6	animals	read_only	2025-05-04 19:10:22.778111
26	12	6	crops	read_only	2025-05-04 19:10:22.836454
27	12	6	tasks	full	2025-05-04 19:10:22.897868
28	12	6	inventory	read_only	2025-05-04 19:10:22.959923
29	13	6	animals	full	2025-05-04 19:10:23.019575
30	13	6	tasks	read_only	2025-05-04 19:10:23.0811
31	13	7	animals	full	2025-05-04 19:10:23.141713
32	14	6	crops	full	2025-05-04 19:10:23.201053
33	14	6	tasks	read_only	2025-05-04 19:10:23.260447
34	14	8	crops	full	2025-05-04 19:10:23.319765
35	15	6	animals	read_only	2025-05-04 19:10:23.378746
36	15	8	animals	read_only	2025-05-04 19:10:23.437621
37	15	6	crops	read_only	2025-05-04 19:10:23.495189
38	15	8	crops	read_only	2025-05-04 19:10:23.557791
39	15	6	inventory	read_only	2025-05-04 19:10:23.618087
40	15	8	inventory	read_only	2025-05-04 19:10:23.677622
41	15	6	tasks	read_only	2025-05-04 19:10:23.737138
42	15	8	tasks	read_only	2025-05-04 19:10:23.796257
43	15	6	employees	read_only	2025-05-04 19:10:23.85606
44	15	8	employees	read_only	2025-05-04 19:10:23.914898
45	15	6	financial	full	2025-05-04 19:10:23.975289
46	15	8	financial	full	2025-05-04 19:10:24.03553
47	15	6	reports	read_only	2025-05-04 19:10:24.131306
48	15	8	reports	read_only	2025-05-04 19:10:24.19088
49	16	9	crops	read_only	2025-05-04 19:10:24.252865
50	16	9	reports	read_only	2025-05-04 19:10:24.313572
52	18	12	goals	manage	2025-05-05 08:35:12.677516
53	18	12	tasks	manage	2025-05-05 08:35:12.677516
54	18	12	animals	manage	2025-05-05 08:35:12.677516
55	18	12	crops	manage	2025-05-05 08:35:12.677516
56	19	12	goals	edit	2025-05-05 08:35:25.774762
57	19	12	tasks	edit	2025-05-05 08:35:25.774762
58	19	12	animals	edit	2025-05-05 08:35:25.774762
59	19	12	crops	edit	2025-05-05 08:35:25.774762
60	20	12	goals	view	2025-05-05 08:35:34.081695
61	20	12	tasks	view	2025-05-05 08:35:34.081695
62	20	12	animals	view	2025-05-05 08:35:34.081695
63	20	12	crops	view	2025-05-05 08:35:34.081695
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, name, email, role, language, farm_id, created_at) FROM stdin;
10	admin	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	Administrador Geral	admin@iagris.com	super_admin	pt	\N	2025-05-04 19:10:20.486275
11	jsilva	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	João Silva	joao@example.com	farm_admin	pt	\N	2025-05-04 19:10:20.559894
12	mluisa	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	Maria Luisa	mluisa@example.com	employee	pt	\N	2025-05-04 19:10:20.624135
13	carlosvet	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	Carlos Pereira	carlos@example.com	veterinarian	pt	\N	2025-05-04 19:10:20.688364
14	anagro	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	Ana Santos	ana@example.com	agronomist	pt	\N	2025-05-04 19:10:20.7594
15	pedroger	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	Pedro Oliveira	pedro@example.com	manager	pt	\N	2025-05-04 19:10:20.819594
16	juliacons	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	Julia Fernandes	julia@example.com	consultant	pt	\N	2025-05-04 19:10:20.879389
18	farmadmin	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	Administrador de Fazenda	farmadmin@teste.com	farm_admin	pt	\N	2025-05-05 08:25:03.459886
19	manager	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	Gerente	manager@teste.com	manager	pt	\N	2025-05-05 08:25:03.518826
20	employee	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	Funcionário	employee@teste.com	employee	pt	\N	2025-05-05 08:25:03.576695
17	superadmin	fac8be17a296d1ec4fb759ac9ce90c93b3c71e6db26d5ca5ece5b3a7c11336b0	Super Administrador	superadmin@teste.com	super_admin	pt	\N	2025-05-05 08:25:03.368615
\.


--
-- Name: animals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.animals_id_seq', 259, true);


--
-- Name: crops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.crops_id_seq', 33, true);


--
-- Name: farms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.farms_id_seq', 12, true);


--
-- Name: goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goals_id_seq', 3, true);


--
-- Name: inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inventory_id_seq', 48, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tasks_id_seq', 49, true);


--
-- Name: user_farms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_farms_id_seq', 32, true);


--
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 63, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 20, true);


--
-- Name: animals animals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.animals
    ADD CONSTRAINT animals_pkey PRIMARY KEY (id);


--
-- Name: crops crops_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.crops
    ADD CONSTRAINT crops_pkey PRIMARY KEY (id);


--
-- Name: farms farms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.farms
    ADD CONSTRAINT farms_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_farms user_farms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_farms
    ADD CONSTRAINT user_farms_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--


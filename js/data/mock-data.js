const MOCK_PLAYER_GAME = `session_id,match_id,match_date,player_id,player_name,team,is_captain
S01,2024-11-03,2024-11-03,Alysson,Alysson,Black,1
S01,2024-11-03,2024-11-03,Ivan,Ivan,Black,0
S01,2024-11-03,2024-11-03,Max,Max,White,1
S01,2024-11-03,2024-11-03,Paul,Paul,White,0
S01,2024-11-10,2024-11-10,Alysson,Alysson,White,1
S01,2024-11-10,2024-11-10,Ivan,Ivan,Black,1
S01,2024-11-10,2024-11-10,Max,Max,White,0
S01,2024-11-10,2024-11-10,Paul,Paul,Black,0
S02,2025-10-05,2025-10-05,Alysson,Alysson,Black,1
S02,2025-10-05,2025-10-05,Ivan,Ivan,Black,0
S02,2025-10-05,2025-10-05,Cindy,Cindy,White,1
S02,2025-10-05,2025-10-05,Mel,Mel,White,0
S02,2025-10-12,2025-10-12,Alysson,Alysson,White,0
S02,2025-10-12,2025-10-12,Ivan,Ivan,Black,1
S02,2025-10-12,2025-10-12,Cindy,Cindy,White,1
S02,2025-10-12,2025-10-12,Mel,Mel,Black,0`;

const MOCK_MATCH_TEAM = `session_id,match_id,match_date,team,goals_for,goals_against,result
S01,2024-11-03,2024-11-03,Black,2,1,W
S01,2024-11-03,2024-11-03,White,1,2,L
S01,2024-11-10,2024-11-10,Black,3,3,D
S01,2024-11-10,2024-11-10,White,3,3,D
S02,2025-10-05,2025-10-05,Black,3,2,W
S02,2025-10-05,2025-10-05,White,2,3,L
S02,2025-10-12,2025-10-12,Black,2,2,D
S02,2025-10-12,2025-10-12,White,2,2,D`;

const MOCK_MATCH_EVENTS = `session_id,match_id,Timestamp,Team,second_assist_player_id,assist_player_id,goal_player_id
S02,2025-10-12,2025-10-12 19:14,Black,,Ivan,Alysson
S02,2025-10-12,2025-10-12 19:18,White,,Cindy,Mel
S02,2025-10-12,2025-10-12 19:25,Black,,Alysson,Ivan
S02,2025-10-12,2025-10-12 19:33,Black,,Ivan,Alysson
S02,2025-10-12,2025-10-12 19:40,White,,Mel,Cindy
S02,2025-10-12,2025-10-12 19:48,Black,,Alysson,Ivan
S02,2025-10-12,2025-10-12 19:55,Black,Ivan,Alysson,Ivan
S02,2025-10-12,2025-10-12 20:02,White,,Cindy,Mel
`;

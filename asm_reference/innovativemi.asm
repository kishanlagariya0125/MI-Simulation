
global main
extern printf
extern scanf

section .data

; ==============================
; MAIN MENU AND MESSAGES
; ==============================

title db 10,'========================================',10
      db '   AMBULANCE TRAFFIC LIGHT CONTROLLER',10
      db '========================================',10,0

menu db 10,'=============== MAIN MENU ===============',10
     db 'A = Normal Traffic',10
     db 'B = Ambulance from NORTH',10
     db 'C = Ambulance from SOUTH',10
     db 'D = Ambulance from EAST',10
     db 'E = Ambulance from WEST',10
     db 'P = Pedestrian Crossing',10
     db 'M = Toggle Manual/Automatic Mode',10
     db 'X = Exit and Show Statistics',10
     db 'Enter choice: ',0

input_format db ' %c',0

density_prompt db 10,'Traffic Density:',10
               db 'L = Low',10
               db 'M = Medium',10
               db 'H = High',10
               db 'Enter density: ',0

manual_prompt db 10,'Manual Mode: Choose Road',10
              db 'N = North/South',10
              db 'E = East/West',10
              db 'Enter road: ',0

normal_msg db 10,'--- NORMAL TRAFFIC ---',10,0

north_msg db 10,'*** AMBULANCE FROM NORTH ***',10,0
south_msg db 10,'*** AMBULANCE FROM SOUTH ***',10,0
east_msg  db 10,'*** AMBULANCE FROM EAST ***',10,0
west_msg  db 10,'*** AMBULANCE FROM WEST ***',10,0

invalid_msg db 10,'Invalid input! Please try again.',10,0
exit_msg db 10,'Program terminated.',10,0

auto_msg db 10,'Operating mode: AUTOMATIC',10,0
manual_msg db 10,'Operating mode: MANUAL',10,0

alert_msg db 7,10,'*** EMERGENCY ALERT! ***',10,0

countdown_fmt db '  Time remaining: %d seconds',10,0

density_low_msg db 'Traffic density: LOW',10,0
density_med_msg db 'Traffic density: MEDIUM',10,0
density_high_msg db 'Traffic density: HIGH',10,0
density_default_msg db 'Invalid density. Using MEDIUM.',10,0

pedestrian_msg db 10,'*** PEDESTRIAN CROSSING ACTIVE ***',10,0
walk_msg db '  Pedestrians may cross.',10,0

ns_green db 10
         db '+--------------------------------------+',10
         db '|       TRAFFIC LIGHT STATUS            |',10
         db '+--------------------------------------+',10
         db '| NORTH / SOUTH : [ GREEN ]             |',10
         db '| EAST  / WEST  : [ RED   ]             |',10
         db '+--------------------------------------+',10,0

ns_yellow db 10
          db '+--------------------------------------+',10
          db '|       TRAFFIC LIGHT STATUS            |',10
          db '+--------------------------------------+',10
          db '| NORTH / SOUTH : [ YELLOW ]            |',10
          db '| EAST  / WEST  : [ RED    ]            |',10
          db '+--------------------------------------+',10,0

ew_green db 10
         db '+--------------------------------------+',10
         db '|       TRAFFIC LIGHT STATUS            |',10
         db '+--------------------------------------+',10
         db '| NORTH / SOUTH : [ RED   ]             |',10
         db '| EAST  / WEST  : [ GREEN ]             |',10
         db '+--------------------------------------+',10,0

ew_yellow db 10
          db '+--------------------------------------+',10
          db '|       TRAFFIC LIGHT STATUS            |',10
          db '+--------------------------------------+',10
          db '| NORTH / SOUTH : [ RED    ]            |',10
          db '| EAST  / WEST  : [ YELLOW ]            |',10
          db '+--------------------------------------+',10,0

all_red db 10
        db '+--------------------------------------+',10
        db '|            SAFETY STATE               |',10
        db '+--------------------------------------+',10
        db '| NORTH / SOUTH : [ RED ]               |',10
        db '| EAST  / WEST  : [ RED ]               |',10
        db '+--------------------------------------+',10,0

priority_ns db 10
            db '*** EMERGENCY PRIORITY: NORTH/SOUTH ***',10,0

priority_ew db 10
            db '*** EMERGENCY PRIORITY: EAST/WEST ***',10,0

ambulance_msg db 10,'*** AMBULANCE PASSING ***',10,0

log_title db 10,'========== EVENT LOG ==========',10,0
log_normal db 'Event: Normal traffic',10,0
log_north db 'Event: Ambulance from NORTH',10,0
log_south db 'Event: Ambulance from SOUTH',10,0
log_east db 'Event: Ambulance from EAST',10,0
log_west db 'Event: Ambulance from WEST',10,0
log_ped db 'Event: Pedestrian crossing',10,0

stats_title db 10,'========== FINAL STATISTICS ==========',10,0
stats_normal db 'Normal traffic cycles: %d',10,0
stats_north db 'North ambulance requests: %d',10,0
stats_south db 'South ambulance requests: %d',10,0
stats_east db 'East ambulance requests: %d',10,0
stats_west db 'West ambulance requests: %d',10,0
stats_ped db 'Pedestrian requests: %d',10,0
stats_total db 'Total ambulance requests: %d',10,0

section .bss

choice resb 4
density_choice resb 4
road_choice resb 4

countdown_val resd 1
duration resd 1
mode resd 1

event_log resb 100
event_count resd 1
event_index resd 1

normal_count resd 1
north_count resd 1
south_count resd 1
east_count resd 1
west_count resd 1
ped_count resd 1
total_ambulance resd 1

section .text

; ==============================
; MAIN PROGRAM
; ==============================

main:

    ; Initialize mode: 0 = automatic
    mov dword [mode],0

    ; Initialize event log
    mov dword [event_count],0

    ; Initialize statistics
    mov dword [normal_count],0
    mov dword [north_count],0
    mov dword [south_count],0
    mov dword [east_count],0
    mov dword [west_count],0
    mov dword [ped_count],0
    mov dword [total_ambulance],0

    push title
    call printf
    add esp,4

    push auto_msg
    call printf
    add esp,4

; ==============================
; MAIN MENU LOOP
; ==============================

menu_loop:

    push menu
    call printf
    add esp,4

    push choice
    push input_format
    call scanf
    add esp,8

    ; Convert lowercase to uppercase
    mov al,[choice]
    cmp al,'a'
    jb check_choice
    cmp al,'z'
    ja check_choice
    sub al,32
    mov [choice],al

check_choice:

    cmp byte [choice],'A'
    je normal_traffic

    cmp byte [choice],'B'
    je north_ambulance

    cmp byte [choice],'C'
    je south_ambulance

    cmp byte [choice],'D'
    je east_ambulance

    cmp byte [choice],'E'
    je west_ambulance

    cmp byte [choice],'P'
    je pedestrian_crossing

    cmp byte [choice],'M'
    je toggle_mode

    cmp byte [choice],'X'
    je exit_program

    push invalid_msg
    call printf
    add esp,4

    jmp menu_loop

; ==============================
; TOGGLE MANUAL / AUTO MODE
; ==============================

toggle_mode:

    xor dword [mode],1

    cmp dword [mode],0
    jne show_manual

    push auto_msg
    call printf
    add esp,4

    jmp menu_loop

show_manual:

    push manual_msg
    call printf
    add esp,4

    jmp menu_loop

; ==============================
; NORMAL TRAFFIC
; ==============================

normal_traffic:

    inc dword [normal_count]

    push dword 1
    call LogEvent
    add esp,4

    push normal_msg
    call printf
    add esp,4

    ; Select traffic density
    push density_prompt
    call printf
    add esp,4

    push density_choice
    push input_format
    call scanf
    add esp,8

    ; Normalize lowercase density input
    mov al,[density_choice]
    cmp al,'a'
    jb check_density
    cmp al,'z'
    ja check_density
    sub al,32
    mov [density_choice],al

check_density:

    cmp byte [density_choice],'L'
    je set_low

    cmp byte [density_choice],'H'
    je set_high

    cmp byte [density_choice],'M'
    je set_medium

    push invalid_msg
    call printf
    add esp,4

    jmp normal_traffic

set_low:

    mov dword [duration],5

    push density_low_msg
    call printf
    add esp,4

    jmp choose_traffic_mode

set_medium:

    mov dword [duration],8

    push density_med_msg
    call printf
    add esp,4

    jmp choose_traffic_mode

set_high:

    mov dword [duration],12

    push density_high_msg
    call printf
    add esp,4

choose_traffic_mode:

    cmp dword [mode],0
    jne manual_traffic

; ==============================
; AUTOMATIC TRAFFIC SEQUENCE
; ==============================

auto_traffic:

    push ns_green
    call printf
    add esp,4

    push dword [duration]
    call Countdown
    add esp,4

    push ns_yellow
    call printf
    add esp,4

    push dword 2
    call Countdown
    add esp,4

    push all_red
    call printf
    add esp,4

    push ew_green
    call printf
    add esp,4

    push dword [duration]
    call Countdown
    add esp,4

    push ew_yellow
    call printf
    add esp,4

    push dword 2
    call Countdown
    add esp,4

    push all_red
    call printf
    add esp,4

    jmp menu_loop

; ==============================
; MANUAL TRAFFIC MODE
; ==============================

manual_traffic:

    push manual_prompt
    call printf
    add esp,4

    push road_choice
    push input_format
    call scanf
    add esp,8

    mov al,[road_choice]
    cmp al,'a'
    jb check_road
    cmp al,'z'
    ja check_road
    sub al,32
    mov [road_choice],al

check_road:

    cmp byte [road_choice],'N'
    je manual_ns

    cmp byte [road_choice],'E'
    je manual_ew

    push invalid_msg
    call printf
    add esp,4

    jmp menu_loop

manual_ns:

    push all_red
    call printf
    add esp,4

    push ns_green
    call printf
    add esp,4

    push dword [duration]
    call Countdown
    add esp,4

    push all_red
    call printf
    add esp,4

    jmp menu_loop

manual_ew:

    push all_red
    call printf
    add esp,4

    push ew_green
    call printf
    add esp,4

    push dword [duration]
    call Countdown
    add esp,4

    push all_red
    call printf
    add esp,4

    jmp menu_loop

; ==============================
; NORTH AMBULANCE
; ==============================

north_ambulance:

    inc dword [north_count]
    inc dword [total_ambulance]

    push dword 2
    call LogEvent
    add esp,4

    push north_msg
    call printf
    add esp,4

    jmp emergency_ns

; ==============================
; SOUTH AMBULANCE
; ==============================

south_ambulance:

    inc dword [south_count]
    inc dword [total_ambulance]

    push dword 3
    call LogEvent
    add esp,4

    push south_msg
    call printf
    add esp,4

    jmp emergency_ns

; ==============================
; NORTH/SOUTH EMERGENCY
; ==============================

emergency_ns:

    ; Emergency alert
    push alert_msg
    call printf
    add esp,4

    ; Stop both roads first
    push all_red
    call printf
    add esp,4

    push priority_ns
    call printf
    add esp,4

    ; Give priority to N/S
    push ns_green
    call printf
    add esp,4

    push dword 5
    call Countdown
    add esp,4

    push ambulance_msg
    call printf
    add esp,4

    ; Restore safety state
    push all_red
    call printf
    add esp,4

    jmp menu_loop

; ==============================
; EAST AMBULANCE
; ==============================

east_ambulance:

    inc dword [east_count]
    inc dword [total_ambulance]

    push dword 4
    call LogEvent
    add esp,4

    push east_msg
    call printf
    add esp,4

    jmp emergency_ew

; ==============================
; WEST AMBULANCE
; ==============================

west_ambulance:

    inc dword [west_count]
    inc dword [total_ambulance]

    push dword 5
    call LogEvent
    add esp,4

    push west_msg
    call printf
    add esp,4

; ==============================
; EAST/WEST EMERGENCY
; ==============================

emergency_ew:

    push alert_msg
    call printf
    add esp,4

    push all_red
    call printf
    add esp,4

    push priority_ew
    call printf
    add esp,4

    push ew_green
    call printf
    add esp,4

    push dword 5
    call Countdown
    add esp,4

    push ambulance_msg
    call printf
    add esp,4

    push all_red
    call printf
    add esp,4

    jmp menu_loop

; ==============================
; PEDESTRIAN CROSSING
; ==============================

pedestrian_crossing:

    inc dword [ped_count]

    push dword 6
    call LogEvent
    add esp,4

    push pedestrian_msg
    call printf
    add esp,4

    ; Stop traffic before pedestrian crossing
    push all_red
    call printf
    add esp,4

    push walk_msg
    call printf
    add esp,4

    push dword 5
    call Countdown
    add esp,4

    ; End pedestrian crossing safely
    push all_red
    call printf
    add esp,4

    jmp menu_loop

; ==============================
; EXIT AND REPORT
; ==============================

exit_program:

    push exit_msg
    call printf
    add esp,4

    push stats_title
    call printf
    add esp,4

    push dword [normal_count]
    push stats_normal
    call printf
    add esp,8

    push dword [north_count]
    push stats_north
    call printf
    add esp,8

    push dword [south_count]
    push stats_south
    call printf
    add esp,8

    push dword [east_count]
    push stats_east
    call printf
    add esp,8

    push dword [west_count]
    push stats_west
    call printf
    add esp,8

    push dword [ped_count]
    push stats_ped
    call printf
    add esp,8

    push dword [total_ambulance]
    push stats_total
    call printf
    add esp,8

    ; Print event log
    push log_title
    call printf
    add esp,4

    mov dword [event_index],0

event_loop:

    mov eax,[event_index]
    cmp eax,[event_count]
    jae event_log_done

    movzx eax,byte [event_log+eax]

    cmp eax,1
    je print_log_normal

    cmp eax,2
    je print_log_north

    cmp eax,3
    je print_log_south

    cmp eax,4
    je print_log_east

    cmp eax,5
    je print_log_west

    cmp eax,6
    je print_log_ped

    jmp event_next

print_log_normal:

    push log_normal
    call printf
    add esp,4
    jmp event_next

print_log_north:

    push log_north
    call printf
    add esp,4
    jmp event_next

print_log_south:

    push log_south
    call printf
    add esp,4
    jmp event_next

print_log_east:

    push log_east
    call printf
    add esp,4
    jmp event_next

print_log_west:

    push log_west
    call printf
    add esp,4
    jmp event_next

print_log_ped:

    push log_ped
    call printf
    add esp,4

event_next:

    inc dword [event_index]
    jmp event_loop

event_log_done:

    xor eax,eax
    ret

; ==============================
; PROCEDURE: COUNTDOWN
; Parameter: [EBP+8] = seconds
; ==============================

Countdown:

    push ebp
    mov ebp,esp

    mov eax,[ebp+8]
    mov [countdown_val],eax

countdown_loop:

    cmp dword [countdown_val],0
    jle countdown_done

    mov eax,[countdown_val]
    push eax
    push countdown_fmt
    call printf
    add esp,8

    dec dword [countdown_val]
    jmp countdown_loop

countdown_done:

    pop ebp
    ret

; ==============================
; PROCEDURE: LOG EVENT
; Parameter: [EBP+8] = event code
; 1 Normal, 2 North, 3 South,
; 4 East, 5 West, 6 Pedestrian
; ==============================

LogEvent:

    push ebp
    mov ebp,esp

    mov eax,[event_count]
    cmp eax,100
    jae log_event_done

    mov edx,[ebp+8]
    mov [event_log+eax],dl

    inc dword [event_count]

log_event_done:

    pop ebp
    ret

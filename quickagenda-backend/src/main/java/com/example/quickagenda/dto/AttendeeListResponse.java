package com.example.quickagenda.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendeeListResponse {
    private List<AttendeeDto> attendees;
    private int yes;
    private int no;
    private int maybe;
}

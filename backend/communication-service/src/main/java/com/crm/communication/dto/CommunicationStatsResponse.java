package com.crm.communication.dto;

import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunicationStatsResponse {

    private long totalMessages;
    private long outgoingMessages;
    private long incomingMessages;
    private long deliveredMessages;
    private long readMessages;
    private long unreadMessages;
    private long scheduledMessages;
    private long starredMessages;
    private double deliveredRate;
    private double readRate;
    private Map<String, Long> messagesByChannel;
    private Map<String, Long> messagesByStatus;
    private Map<String, Long> messagesByDirection;
}
